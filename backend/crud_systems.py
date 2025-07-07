from sqlalchemy import select, update, delete, func
from typing import List, Optional

from . import models
from . import schemas
from .database import database # Using the 'databases' instance

async def create_system(system_data: schemas.SystemCreate) -> models.System:
    """
    Creates a new system in the database.
    """
    values = system_data.model_dump()
    # last_checked_at is handled by DB model defaults/onupdate

    query = models.System.__table__.insert().values(**values)
    last_record_id = await database.execute(query)

    return await get_system(system_id=last_record_id) # Fetch to get complete object

async def get_system(system_id: int) -> Optional[models.System]:
    """
    Retrieves a single system by its ID.
    """
    query = select(models.System.__table__).where(models.System.__table__.c.id == system_id)
    result = await database.fetch_one(query)
    return result if result else None

async def get_system_by_name(name: str) -> Optional[models.System]:
    """
    Retrieves a single system by its name.
    """
    query = select(models.System.__table__).where(models.System.__table__.c.name == name)
    result = await database.fetch_one(query)
    return result if result else None

async def get_systems(skip: int = 0, limit: int = 20) -> List[models.System]: # Default limit to 20 for systems
    """
    Retrieves a list of systems with pagination.
    """
    query = select(models.System.__table__).offset(skip).limit(limit).order_by(models.System.__table__.c.name) # Order by name
    results = await database.fetch_all(query)
    return results

async def count_systems() -> int:
    """
    Counts the total number of systems.
    """
    query = select(func.count()).select_from(models.System.__table__)
    count = await database.fetch_val(query)
    return count if count is not None else 0

async def update_system(system_id: int, system_data: schemas.SystemUpdate) -> Optional[models.System]:
    """
    Updates an existing system.
    Returns the updated system object or None if not found.
    """
    update_data = system_data.model_dump(exclude_unset=True)

    if not update_data:
        return await get_system(system_id) # No actual changes submitted

    # last_checked_at will be updated by the DB model's onupdate trigger
    # if other fields are changed. If we want to force update it even if no other
    # fields changed, we'd need to explicitly add it to update_data here with current time.

    query = (
        update(models.System.__table__)
        .where(models.System.__table__.c.id == system_id)
        .values(**update_data)
    )

    # Check if row exists before update to return None if not found
    existing_system = await get_system(system_id)
    if not existing_system:
        return None

    await database.execute(query)
    return await get_system(system_id) # Fetch updated record

async def delete_system(system_id: int) -> bool:
    """
    Deletes a system by its ID.
    Returns True if deletion was successful, False otherwise (e.g., system not found).
    """
    existing_system = await get_system(system_id)
    if not existing_system:
        return False

    query = delete(models.System.__table__).where(models.System.__table__.c.id == system_id)
    await database.execute(query)
    return True
