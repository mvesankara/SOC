from fastapi import APIRouter, Depends
from typing import List, Dict, Any, Annotated

from .. import crud_dashboard, models, schemas # Relative imports
from .auth import get_current_active_user

router = APIRouter()

@router.get("/stats", response_model=schemas.DashboardStats) # Define DashboardStats schema later
async def get_dashboard_statistics(
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve aggregated statistics for the dashboard.
    Requires authentication.
    """
    stats = await crud_dashboard.get_dashboard_stats()
    return stats # Pydantic will validate against DashboardStats schema

@router.get("/systems-status", response_model=List[schemas.SystemStatus]) # Define SystemStatus schema later
async def get_systems_status_info(
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Retrieve status of various monitored systems (currently static data).
    Requires authentication.
    """
    status_data = crud_dashboard.get_static_systems_status()
    return status_data # Pydantic will validate against List[SystemStatus]
