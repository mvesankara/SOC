from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Annotated

from .. import crud_systems, models, schemas # Relative imports
from .auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.SystemRead, status_code=status.HTTP_201_CREATED)
async def create_new_system(
    system_in: schemas.SystemCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Create a new system entry. Requires authentication.
    """
    # Check if system name already exists
    existing_system = await crud_systems.get_system_by_name(name=system_in.name)
    if existing_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"System with name '{system_in.name}' already exists.",
        )
    return await crud_systems.create_system(system_data=system_in)

@router.get("/", response_model=List[schemas.SystemRead])
async def read_all_systems(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100) # Default 20, max 100
):
    """
    Retrieve all systems with pagination. Requires authentication.
    """
    # Note: We are not returning total count for systems list for now, unlike incidents.
    # Can be added if pagination UI for systems becomes complex.
    systems = await crud_systems.get_systems(skip=skip, limit=limit)
    return systems

@router.get("/{system_id}", response_model=schemas.SystemRead)
async def read_single_system(
    system_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve a single system by its ID. Requires authentication.
    """
    db_system = await crud_systems.get_system(system_id=system_id)
    if db_system is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")
    return db_system

@router.put("/{system_id}", response_model=schemas.SystemRead)
async def update_existing_system(
    system_id: int,
    system_in: schemas.SystemUpdate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Update an existing system. Requires authentication.
    """
    # Check for name conflict if name is being changed
    if system_in.name:
        existing_system_with_name = await crud_systems.get_system_by_name(name=system_in.name)
        if existing_system_with_name and existing_system_with_name.id != system_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another system with name '{system_in.name}' already exists.",
            )

    updated_system = await crud_systems.update_system(system_id=system_id, system_data=system_in)
    if updated_system is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found for update")
    return updated_system

@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_system(
    system_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Delete a system by its ID. Requires authentication.
    """
    success = await crud_systems.delete_system(system_id=system_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found or could not be deleted")
    return # No content
