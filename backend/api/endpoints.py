from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Annotated

from .. import crud_incidents, schemas, models # Relative imports for backend package
from ..database import database # If direct db access is needed, though CRUD handles it
from .auth import get_current_active_user # Import the dependency

router = APIRouter()

# Dependency to ensure database is connected for requests to this router
# This is already handled by lifespan in main.py, but can be an explicit per-router check if desired.
# For now, we rely on the global lifespan.
# async def get_db_conn_status():
# if not database.is_connected:
# raise HTTPException(status_code=503, detail="Database not connected")
# return True


@router.post("/incidents/", response_model=schemas.IncidentRead, status_code=201)
async def create_new_incident(
    incident: schemas.IncidentCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Create a new incident. Requires authentication.
    """
    # TODO: Future enhancement: associate incident with current_user.id
    created_incident = await crud_incidents.create_incident(incident_data=incident)
    # The crud_incidents.create_incident now returns a models.Incident like object (RowProxy)
    # Pydantic's from_orm/from_attributes will handle the conversion in response_model
    return created_incident

@router.get("/incidents/", response_model=schemas.IncidentList)
async def read_all_incidents(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by incident status (e.g., Ouvert, Résolu)"),
    criticite: Optional[str] = Query(None, description="Filter by incident criticité (e.g., Critique, Moyen)"),
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve all incidents with pagination and optional filtering by status and criticité. Requires authentication.
    """
    incidents_records = await crud_incidents.get_incidents(
        skip=skip, limit=limit, status=status, criticite=criticite
    )
    total_incidents = await crud_incidents.count_incidents(
        status=status, criticite=criticite
    )

    # Convert each record (which are SQLAlchemy RowProxy objects from 'databases')
    # to schemas.IncidentRead if needed, though Pydantic's from_attributes should handle it.
    # For IncidentList, items should be List[schemas.IncidentRead]
    # Pydantic V2's from_attributes in IncidentRead should map these directly.
    return schemas.IncidentList(items=incidents_records, total=total_incidents)


@router.get("/incidents/{incident_id}", response_model=schemas.IncidentRead)
async def read_single_incident(
    incident_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve a single incident by its ID. Requires authentication.
    """
    db_incident = await crud_incidents.get_incident(incident_id=incident_id)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident


@router.put("/incidents/{incident_id}", response_model=schemas.IncidentRead)
async def update_existing_incident(
    incident_id: int,
    incident_update: schemas.IncidentUpdate,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Update an existing incident. Requires authentication.
    """
    # TODO: Future: Add logic to check if current_user has permission to update this incident.
    updated_incident = await crud_incidents.update_incident(incident_id=incident_id, incident_data=incident_update)
    if updated_incident is None:
        # This case implies the incident_id itself was not found by crud_incidents.update_incident's internal get_incident call
        raise HTTPException(status_code=404, detail="Incident not found for update")
    return updated_incident


@router.delete("/incidents/{incident_id}", status_code=204) # 204 No Content for successful deletion
async def delete_existing_incident(
    incident_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Delete an incident by its ID. Requires authentication.
    """
    # TODO: Future: Add logic to check if current_user has permission to delete this incident.
    success = await crud_incidents.delete_incident(incident_id=incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found or could not be deleted")
    # No content to return on successful deletion with 204
    return
