from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from storage.database import SessionLocal
from detection.anomaly_detector import detect_anomaly

router = APIRouter(prefix="/anomaly", tags=["anomaly"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from datetime import datetime, timezone
from correlation.incident_manager import IncidentManager

@router.get("/check")
def check_anomaly(db: Session = Depends(get_db)):
    result = detect_anomaly(db)
    
    # Update Incident State
    now = datetime.now(timezone.utc)
    manager = IncidentManager.get_instance()
    manager.update(
        anomaly_result=result,
        affected_services=result.get("affected_services", []),
        now=now
    )
    
    return result
