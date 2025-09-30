from sqlalchemy import select
from typing import Optional

from . import models
from . import schemas
from .database import database
from .security import get_password_hash # Import the hashing function

async def create_user(user_data: schemas.UserCreate) -> models.User:
    """
    Creates a new user in the database.
    - Hashes the password before storing.
    - Returns the created user object (similar to how create_incident works).
    """
    hashed_password = get_password_hash(user_data.password)

    # Prepare values for insertion, replacing plain password with hashed password
    # .model_dump(exclude={'password'}) might be cleaner if UserCreate had more fields
    user_db_values = user_data.model_dump()
    del user_db_values['password'] # Remove plain password
    user_db_values['hashed_password'] = hashed_password
    # Explicitly set default values to ensure they are present for the INSERT statement
    user_db_values.setdefault('is_active', True)
    user_db_values.setdefault('is_superuser', False)

    query = models.User.__table__.insert().values(**user_db_values)

    last_record_id = await database.execute(query)

    # Fetch the created user to return the full object, including auto-generated ID
    # and default values like is_active, is_superuser
    # Exclude 'hashed_password' from being returned directly if schemas.UserRead is used later
    # For now, this returns the model object which can be mapped by UserRead schema
    return await get_user(user_id=last_record_id) # Assuming get_user is defined below


async def get_user_by_username(username: str) -> Optional[models.User]:
    """
    Retrieves a single user by their username.
    """
    query = select(models.User.__table__).where(models.User.__table__.c.username == username)
    result = await database.fetch_one(query)
    return result if result else None


async def get_user_by_email(email: str) -> Optional[models.User]:
    """
    Retrieves a single user by their email.
    """
    if not email: # Guard against empty email if it's optional but being queried
        return None
    query = select(models.User.__table__).where(models.User.__table__.c.email == email)
    result = await database.fetch_one(query)
    return result if result else None

async def get_user(user_id: int) -> Optional[models.User]:
    """
    Retrieves a single user by their ID.
    """
    query = select(models.User.__table__).where(models.User.__table__.c.id == user_id)
    result = await database.fetch_one(query)
    return result if result else None

# Optional: Update user function (excluding password changes here)
# async def update_user(user_id: int, user_update_data: schemas.UserUpdate) -> Optional[models.User]:
#     update_data = user_update_data.model_dump(exclude_unset=True)
#     if not update_data:
#         return await get_user(user_id) # Or raise an error/return None
#
#     query = (
#         models.User.__table__.update()
#         .where(models.User.__table__.c.id == user_id)
#         .values(**update_data)
#     )
#     await database.execute(query)
#     return await get_user(user_id)

# Note: Deleting users often involves more complex logic (e.g., soft delete, handling related data)
# and might be added later based on requirements.
