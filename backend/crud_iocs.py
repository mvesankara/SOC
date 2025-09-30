from sqlalchemy import select, update, delete, func
from typing import List, Optional
import datetime

from . import models
from . import schemas
from .database import database

async def create_ioc(ioc_data: schemas.IoCCreate) -> models.IndicatorOfCompromise:
    """
    Creates a new IoC in the database.
    """
    values = ioc_data.model_dump()
    now = datetime.datetime.utcnow()
    values['first_seen'] = now
    values['last_seen'] = now
    query = models.IndicatorOfCompromise.__table__.insert().values(**values)
    last_record_id = await database.execute(query)
    return await get_ioc(ioc_id=last_record_id)

async def get_ioc(ioc_id: int) -> Optional[models.IndicatorOfCompromise]:
    """
    Retrieves a single IoC by its ID.
    """
    query = select(models.IndicatorOfCompromise.__table__).where(models.IndicatorOfCompromise.__table__.c.id == ioc_id)
    result = await database.fetch_one(query)
    return result if result else None

async def get_iocs(
    skip: int = 0,
    limit: int = 100,
    ioc_type: Optional[str] = None
) -> List[models.IndicatorOfCompromise]:
    """
    Retrieves a list of IoCs with pagination and optional filtering.
    """
    query = select(models.IndicatorOfCompromise.__table__)

    if ioc_type:
        query = query.where(models.IndicatorOfCompromise.__table__.c.type == ioc_type)

    query = query.order_by(models.IndicatorOfCompromise.__table__.c.last_seen.desc())
    query = query.offset(skip).limit(limit)

    results = await database.fetch_all(query)
    return results

async def count_iocs(ioc_type: Optional[str] = None) -> int:
    """
    Counts the total number of IoCs, optionally applying filters.
    """
    query = select(func.count()).select_from(models.IndicatorOfCompromise.__table__)

    if ioc_type:
        query = query.where(models.IndicatorOfCompromise.__table__.c.type == ioc_type)

    count = await database.fetch_val(query)
    return count if count is not None else 0

async def update_ioc(ioc_id: int, ioc_data: schemas.IoCUpdate) -> Optional[models.IndicatorOfCompromise]:
    """
    Updates an existing IoC.
    """
    update_data = ioc_data.model_dump(exclude_unset=True)

    if not update_data:
        return await get_ioc(ioc_id)

    query = (
        update(models.IndicatorOfCompromise.__table__)
        .where(models.IndicatorOfCompromise.__table__.c.id == ioc_id)
        .values(**update_data)
    )
    await database.execute(query)
    return await get_ioc(ioc_id)

async def delete_ioc(ioc_id: int) -> bool:
    """
    Deletes an IoC by its ID.
    """
    ioc = await get_ioc(ioc_id)
    if not ioc:
        return False

    query = delete(models.IndicatorOfCompromise.__table__).where(models.IndicatorOfCompromise.__table__.c.id == ioc_id)
    await database.execute(query)
    return True