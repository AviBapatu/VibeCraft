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
    


from reasoning.agent import ReasoningAgent, IncidentReasoningRequest, ReasoningResult
from fastapi import HTTPException

@router.post("/reason", response_model=ReasoningResult)
def reason_about_incident():
    """
    Analyzes the current active incident using the Reasoning Agent.
    """
    manager = IncidentManager.get_instance()
    current_data = manager.get_current()
    
    if not current_data:
        raise HTTPException(status_code=409, detail="No active incident to reason about")
        
    # Extract similar incidents from the current incident data
    # (The IncidentManager populated this on creation/update)
    similar = current_data.get("similar_incidents", [])
    
    # Initialize Agent
    agent = ReasoningAgent()
    
    # Analyze
    result = agent.analyze_incident(current_data, similar)
    
    return result
