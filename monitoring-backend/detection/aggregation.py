from typing import List
from models.log import Log

def compute_error_rate(logs: List[Log]) -> float:
    if not logs:
        return 0.0
    error_count = sum(1 for log in logs if (log.status_code is not None and log.status_code >= 400) or log.level == 'ERROR')
    return error_count / len(logs)

def compute_avg_latency(logs: List[Log]) -> float:
    valid_logs = [log.latency_ms for log in logs if log.latency_ms is not None]
    if not valid_logs:
        return 0.0
    return sum(valid_logs) / len(valid_logs)

def compute_log_rate(logs: List[Log], window_seconds: float) -> float:
    if window_seconds <= 0:
        return 0.0
    return len(logs) / window_seconds

def compute_avg_retry(logs: List[Log]) -> float:
    valid_logs = [log.retry_count for log in logs if log.retry_count is not None]
    if not valid_logs:
        return 0.0
    return sum(valid_logs) / len(valid_logs)
