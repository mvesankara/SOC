from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession # Though 'databases' library uses its own session like mechanism
from typing import List, Optional

from . import models
from . import schemas
from .database import database # Using the 'databases' instance

# Note: The 'databases' library doesn't use SQLAlchemy's AsyncSession directly in the same way
# as pure SQLAlchemy async. It manages connections and transactions via the 'database' instance.

async def create_incident(incident_data: schemas.IncidentCreate) -> models.Incident:
    """
    Creates a new incident in the database.
    Returns the created incident object (as if read from DB, including ID and timestamp).
    """
    # The SQLAlchemy model 'Incident' has a default for timestamp.
    # We construct the values dictionary from the Pydantic schema.
    values = incident_data.model_dump()

    # Using SQLAlchemy core insert statement with the 'databases' library
    query = models.Incident.__table__.insert().values(**values)

    # 'database.execute' returns the last inserted primary key
    last_record_id = await database.execute(query)

    # To return the full incident object, we fetch it after creation
    # This ensures we get auto-generated values like id and timestamp
    return await get_incident(incident_id=last_record_id)


async def get_incident(incident_id: int) -> Optional[models.Incident]:
    """
    Retrieves a single incident by its ID.
    """
    query = select(models.Incident.__table__).where(models.Incident.__table__.c.id == incident_id)
    result = await database.fetch_one(query)
    return result if result else None


async def get_incidents(skip: int = 0, limit: int = 100) -> List[models.Incident]:
    """
    Retrieves a list of incidents with pagination.
    """
    query = select(models.Incident.__table__).offset(skip).limit(limit).order_by(models.Incident.__table__.c.id.desc())
    results = await database.fetch_all(query)
    return results

async def count_incidents() -> int:
    """
    Counts the total number of incidents.
    """
    query = select(func.count()).select_from(models.Incident.__table__)
    count = await database.fetch_val(query)
    return count if count is not None else 0


async def update_incident(incident_id: int, incident_data: schemas.IncidentUpdate) -> Optional[models.Incident]:
    """
    Updates an existing incident.
    Returns the updated incident object or None if not found.
    """
    # Get data to update, excluding unset fields to allow partial updates
    update_data = incident_data.model_dump(exclude_unset=True)

    if not update_data: # Nothing to update
        return await get_incident(incident_id)

    query = (
        update(models.Incident.__table__)
        .where(models.Incident.__table__.c.id == incident_id)
        .values(**update_data)
    )

    await database.execute(query)

    # Fetch and return the updated incident
    # Note: Some DBs might return the updated row directly, but fetching ensures consistency
    return await get_incident(incident_id)


async def delete_incident(incident_id: int) -> bool:
    """
    Deletes an incident by its ID.
    Returns True if deletion was successful (or row existed), False otherwise.
    For simplicity, we might not check if row existed before delete with 'databases' library.
    A more robust way would be to check if get_incident(incident_id) exists first.
    """
    # First, check if the incident exists
    incident = await get_incident(incident_id)
    if not incident:
        return False # Or raise HTTPException(status_code=404, detail="Incident not found") from API layer

    query = delete(models.Incident.__table__).where(models.Incident.__table__.c.id == incident_id)
    await database.execute(query)
    return True
