from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Annotated

from .. import crud_iocs, schemas, models
from .auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.IoCRead, status_code=201)
async def create_new_ioc(
    ioc: schemas.IoCCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Create a new Indicator of Compromise (IoC). Requires authentication.
    """
    created_ioc = await crud_iocs.create_ioc(ioc_data=ioc)
    return created_ioc

@router.get("/", response_model=schemas.IoCList)
async def read_all_iocs(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of records to return"),
    ioc_type: Optional[str] = Query(None, description="Filter by IoC type (e.g., ip_address, domain_name)")
):
    """
    Retrieve all IoCs with pagination and optional filtering by type. Requires authentication.
    """
    ioc_records = await crud_iocs.get_iocs(skip=skip, limit=limit, ioc_type=ioc_type)
    total_iocs = await crud_iocs.count_iocs(ioc_type=ioc_type)
    return schemas.IoCList(items=ioc_records, total=total_iocs)

@router.get("/{ioc_id}", response_model=schemas.IoCRead)
async def read_single_ioc(
    ioc_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve a single IoC by its ID. Requires authentication.
    """
    db_ioc = await crud_iocs.get_ioc(ioc_id=ioc_id)
    if db_ioc is None:
        raise HTTPException(status_code=404, detail="IoC not found")
    return db_ioc

@router.put("/{ioc_id}", response_model=schemas.IoCRead)
async def update_existing_ioc(
    ioc_id: int,
    ioc_update: schemas.IoCUpdate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Update an existing IoC. Requires authentication.
    """
    updated_ioc = await crud_iocs.update_ioc(ioc_id=ioc_id, ioc_data=ioc_update)
    if updated_ioc is None:
        raise HTTPException(status_code=404, detail="IoC not found for update")
    return updated_ioc

@router.delete("/{ioc_id}", status_code=204)
async def delete_existing_ioc(
    ioc_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Delete an IoC by its ID. Requires authentication.
    """
    success = await crud_iocs.delete_ioc(ioc_id=ioc_id)
    if not success:
        raise HTTPException(status_code=404, detail="IoC not found or could not be deleted")
    return