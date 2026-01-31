from fastapi import APIRouter, Body, HTTPException
from correlation.incident_manager import IncidentManager, ApprovalStatus, ApprovalLockError
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/incident", tags=["incident"])

class ApprovalRequest(BaseModel):
    incident_id: str
    decision: Literal["APPROVE", "REJECT"]
    actor: str
    comment: Optional[str] = None

class ApprovalResponse(BaseModel):
    incident_id: str
    approval_status: str
    approved_at: Optional[str] = None

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

@router.post("/approve", response_model=ApprovalResponse)
def approve_incident_endpoint(request: ApprovalRequest = Body(...)):
    """
    Approves or Rejects an incident's recommended action.
    Requires reasoning to be present and confidence threshold met.
    """
    manager = IncidentManager.get_instance()
    
    try:
        if request.decision == "APPROVE":
            result = manager.approve_incident(request.incident_id, request.actor, request.comment)
        else:
            result = manager.reject_incident(request.incident_id, request.actor, request.comment)
            
        return {
            "incident_id": request.incident_id,
            "approval_status": result["approval"]["status"],
            "approved_at": result["approval"].get("decided_at")
        }
    except ApprovalLockError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from reasoning.agent import ReasoningAgent, IncidentReasoningRequest, ReasoningResult

@router.post("/reason", response_model=ReasoningResult)
def reason_about_incident(force_refresh: bool = False):
    """
    Analyzes the current active incident using the Reasoning Agent.
    """
    manager = IncidentManager.get_instance()
    current_data = manager.get_current()
    
    if not current_data:
        raise HTTPException(status_code=409, detail="No active incident to reason about")

    # CACHING LOGIC: If reasoning exists, return it (unless forced)
    if not force_refresh and current_data.get("reasoning"):
        print(f"Returning cached reasoning for {current_data['incident_id']}")
        return current_data["reasoning"]
        
    # Extract similar incidents from the current incident data
    # (The IncidentManager populated this on creation/update)
    similar = current_data.get("similar_incidents", [])
    
    # Initialize Agent
    agent = ReasoningAgent()
    
    # Analyze
    result = agent.analyze_incident(current_data, similar)
    
    # Store reasoning in the incident so it can be approved later
    manager.update_reasoning(current_data["incident_id"], result)
    
    return result
