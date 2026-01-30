from pydantic import BaseModel
from typing import Optional

class LogEntry(BaseModel):
    timestamp: str
    service: str
    level: str
    message: str

    request_id: Optional[str]
    ip: Optional[str]
    endpoint: Optional[str]
    method: Optional[str]

    latency_ms: Optional[int]
    status_code: Optional[int]

    cpu_pct: Optional[float]
    memory_mb: Optional[float]

    error_type: Optional[str]
    retry_count: Optional[int]
