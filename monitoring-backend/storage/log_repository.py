from sqlalchemy.orm import Session
from models.log import Log

def save_log(db: Session, log_data: dict):
    log = Log(**log_data)
    db.add(log)
    db.commit()
