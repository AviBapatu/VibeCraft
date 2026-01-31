from datetime import datetime

PIPELINE_STATE = {
    "last_ingest_at": None,
    "last_aggregation_at": None,
    "last_detection_at": None,
    "last_incident_update_at": None,
    "last_detection_result": None,
    "last_metrics": None,
    "last_error": None,
}

def update_state(**kwargs):
    PIPELINE_STATE.update(kwargs)
    PIPELINE_STATE["updated_at"] = datetime.utcnow().isoformat()
