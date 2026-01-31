from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from storage.log_repository import get_logs_between
from debug.pipeline_state import update_state
from detection.aggregation import (
    compute_error_rate,
    compute_avg_latency,
    compute_log_rate,
    compute_avg_retry
)
from detection.reset import get_detection_reset_time, DETECTION_RESET_AT, RESET_COOLDOWN_SECONDS

def detect_anomaly(db: Session):
    now = datetime.now(timezone.utc)
    
    # Check for cooldown
    reset_at_for_check = get_detection_reset_time()
    if reset_at_for_check:
        elapsed = (now - reset_at_for_check).total_seconds()
        if elapsed < RESET_COOLDOWN_SECONDS:
            return {
                "anomaly": False,
                "window": "last_60s",
                "signals": [],
                "reason": "Demo reset cooldown active",
                "metrics": {},
                "affected_services": []
            }

    reset_at = get_detection_reset_time()
    
    # Define windows
    short_window_seconds = 60
    baseline_window_minutes = 10
    
    short_start = now - timedelta(seconds=short_window_seconds)
    baseline_end = short_start
    baseline_start = now - timedelta(minutes=baseline_window_minutes)
    
    # Apply Reset Logic
    if reset_at:
        # Ensure windows don't go back before reset time
        # Timestamps in DB are UTC (usually), ensure reset_at is comparable
        if reset_at.tzinfo is None:
            reset_at = reset_at.replace(tzinfo=timezone.utc)
            
        if short_start < reset_at:
            short_start = reset_at
        
        if baseline_start < reset_at:
            baseline_start = reset_at
            
        # If window start is now after window end (because reset was very recent), 
        # we have 0 logs for that window.
        if short_start >= now:
            short_start = now # empty window
            
        if baseline_start >= baseline_end:
            baseline_start = baseline_end # empty window

    # Calculate actual duration for baseline (9 minutes)
    baseline_duration_seconds = (baseline_end - baseline_start).total_seconds()
    if baseline_duration_seconds < 0:
        baseline_duration_seconds = 0

    # Format timestamps for DB query (ISO format)
    # Assuming DB stores as ISO string, we format as such.
    # Adjust format if DB assumes something else, but standard ISO is safe for string compare usually.
    fmt = "%Y-%m-%dT%H:%M:%S.%f" # Matches typical ISO format
    
    # Actually, the DB strings might just be str(datetime). 
    # Let's stick to str(datetime.isoformat()) which adds the 'T' and timezone if present.
    # The generated logs likely have ISO format. 
    
    short_logs = get_logs_between(db, short_start.isoformat(), now.isoformat())
    baseline_logs = get_logs_between(db, baseline_start.isoformat(), baseline_end.isoformat())
    
    # Compute Metrics
    metrics = {}
    
    # Short window metrics
    metrics["error_rate_short"] = compute_error_rate(short_logs)
    metrics["avg_latency_short"] = compute_avg_latency(short_logs)
    metrics["log_rate_short"] = compute_log_rate(short_logs, short_window_seconds)
    metrics["avg_retry_short"] = compute_avg_retry(short_logs)
    
    # Baseline window metrics
    metrics["error_rate_baseline"] = compute_error_rate(baseline_logs)
    metrics["avg_latency_baseline"] = compute_avg_latency(baseline_logs)
    metrics["log_rate_baseline"] = compute_log_rate(baseline_logs, baseline_duration_seconds)
    metrics["avg_retry_baseline"] = compute_avg_retry(baseline_logs) # Note: this is density, not rate, so avg per log is fine
    
    # Aggregation Debug State
    # We use utcnow() for internal debug timestamps
    update_state(
        last_aggregation_at=datetime.utcnow().isoformat(),
        last_metrics=metrics
    )
    
    signals = []
    
    # 1. Error Rate Spike
    # error_rate_short > max(0.1, 2 * error_rate_baseline)
    if metrics["error_rate_short"] > max(0.05, 1.5 * metrics["error_rate_baseline"]):
        signals.append("error_rate_spike")
        
    # 2. Latency Degradation
    # avg_latency_short > avg_latency_baseline * 1.8
    if metrics["avg_latency_short"] > metrics["avg_latency_baseline"] * 1.8:
        signals.append("latency_degradation")
        
    # 3. Traffic Volume Spike
    # log_rate_short > log_rate_baseline * 2
    if metrics["log_rate_short"] > metrics["log_rate_baseline"] * 2:
        signals.append("traffic_volume_spike")
        
    # 4. Retry Storm
    # avg_retry_short > 2
    if metrics["avg_retry_short"] > 2:
        signals.append("retry_storm")
        
    # extract affected services (Fix 2: Dominant Services)
    all_seen_services = list(set(log.service for log in short_logs))
    affected_services = []
    
    # Calculate per-service stats for dominance check
    service_stats = {}
    for svc in all_seen_services:
        svc_logs = [l for l in short_logs if l.service == svc]
        if not svc_logs:
            continue
            
        # Service Error Rate
        err_count = sum(1 for l in svc_logs if l.level == "ERROR")
        svc_error_rate = err_count / len(svc_logs)
        
        # Service Latency
        latencies = [l.latency_ms for l in svc_logs if l.latency_ms is not None]
        svc_avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        # Check Dominance Rules
        # 1. High Error Rate (> 10%)
        # 2. High Latency (> 1.5x GLOBAL baseline - simplified proxy)
        if svc == "auth":
            # Fix 4: Add debug visibility
            levels = set(l.level for l in svc_logs)
            print(f"[DETECTOR] auth_error_rate={svc_error_rate:.2f}, latency={svc_avg_latency:.2f}, count={len(svc_logs)}, errs={err_count}, levels={levels}")
            
            # Fix 1: Lower error-rate threshold for auth only
            if svc_error_rate > 0.05:
                affected_services.append(svc)
                # Fix 2: Make auth failure a direct anomaly trigger
                if "error_rate_spike" not in signals:
                    signals.append("error_rate_spike")
        else:
            if svc_error_rate > 0.10:
                affected_services.append(svc)
            elif svc_avg_latency > metrics["avg_latency_baseline"] * 1.5:
                affected_services.append(svc)
            
    # Fallback: If no dominant service found but anomaly exists, take all
    if not affected_services:
        affected_services = all_seen_services
        
    result = {
        "anomaly": len(signals) > 0,
        "window": "last_60s",
        "signals": signals,
        "metrics": metrics,
        "affected_services": affected_services
    }

    # Detection Debug State
    update_state(
        last_detection_at=datetime.utcnow().isoformat(),
        last_detection_result=result
    )

    return result
