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

@router.get("/similar")
def get_similar_incidents():
    """
    Returns similar past incidents for the CURRENT active incident.
    Returns: { "similar_incidents": [...] }
    """
    manager = IncidentManager.get_instance()
    current = manager.get_current()
    if not current:
        return {"similar_incidents": []}
    
    return {"similar_incidents": current.get("similar_incidents", [])}
