from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas.log_schema import LogEntry
from storage.database import SessionLocal
from storage.log_repository import save_log

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from debug.pipeline_state import update_state

@router.post("/ingest/log")
def ingest_log(log: LogEntry, db: Session = Depends(get_db)):
    save_log(db, log.dict())
    update_state(last_ingest_at=datetime.utcnow().isoformat())
    return {"status": "ok"}
