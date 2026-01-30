from fastapi import APIRouter
from correlation.incident_manager import IncidentManager

router = APIRouter(prefix="/incident", tags=["incident"])

@router.get("/current")
def get_current_incident():
    """
    Returns the active incident (OPEN, ONGOING, or RESOLVED) or null if none.
    """
    manager = IncidentManager.get_instance()
    return manager.get_current()
