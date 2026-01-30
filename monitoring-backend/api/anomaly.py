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

@router.get("/check")
def check_anomaly(db: Session = Depends(get_db)):
    return detect_anomaly(db)
