from datetime import datetime, timedelta

INCIDENT_RESOLUTION_TIMEOUT = 120  # seconds

def is_correlated(last_seen: datetime, current_time: datetime) -> bool:
    """
    Rule 1: Time Proximity
    If signals occur within <= 2 windows (approx 120s), they belong to the same incident.
    Actually, we use the timeout constant as the boundary.
    """
    if not last_seen:
        return False
    return (current_time - last_seen).total_seconds() <= INCIDENT_RESOLUTION_TIMEOUT

def calculate_severity(signals: set) -> str:
    """
    Rule 5: Severity Calculation
    
    Scores:
    error_rate_spike = 3
    latency_degradation = 2
    traffic_volume_spike = 1
    retry_storm = 2
    
    Mapping:
    score >= 4 -> HIGH
    score >= 2 -> MEDIUM
    else -> LOW
    """
    score = 0
    if "error_rate_spike" in signals:
        score += 3
    if "latency_degradation" in signals:
        score += 2
    if "traffic_volume_spike" in signals:
        score += 1
    if "retry_storm" in signals:
        score += 2
        
    if score >= 4:
        return "HIGH"
    elif score >= 2:
        return "MEDIUM"
    else:
        return "LOW"
