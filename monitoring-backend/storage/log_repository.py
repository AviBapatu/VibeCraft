from sqlalchemy.orm import Session
from models.log import Log

def save_log(db: Session, log_data: dict):
    log = Log(**log_data)
    db.add(log)
    db.commit()

def get_logs_between(db: Session, start_ts: str, end_ts: str):
    return db.query(Log).filter(
        Log.timestamp >= start_ts,
        Log.timestamp < end_ts
    ).all()
