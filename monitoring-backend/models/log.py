from sqlalchemy import Column, Integer, String, Float
from storage.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String)
    service = Column(String)
    level = Column(String)
    message = Column(String)

    request_id = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    method = Column(String, nullable=True)

    latency_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=True)

    cpu_pct = Column(Float, nullable=True)
    memory_mb = Column(Float, nullable=True)

    error_type = Column(String, nullable=True)
    retry_count = Column(Integer, nullable=True)
