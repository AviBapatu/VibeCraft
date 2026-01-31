from fastapi import APIRouter
from correlation.incident_manager import IncidentManager
from detection.reset import reset_detection_state

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/reset")
def reset_demo_state():
    IncidentManager.get_instance().reset_demo_state()
    reset_detection_state()
    print("[DEMO] Incident and detection state reset")
    return {
        "status": "reset",
        "message": "Demo state reset successfully"
    }
