from datetime import datetime
from typing import Optional, List, Set, Dict, Any
import uuid
from correlation.incident_rules import (
    is_correlated, 
    calculate_severity, 
    INCIDENT_RESOLUTION_TIMEOUT
)

class Incident:
    def __init__(self, services: Set[str], signals: Set[str], started_at: datetime):
        self.incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        self.status = "OPEN"
        self.started_at = started_at
        self.last_seen_at = started_at
        self.services = services
        self.signals = signals
        self.severity = calculate_severity(signals)
        self.window_count = 1

    def to_dict(self):
        return {
            "incident_id": self.incident_id,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "last_seen_at": self.last_seen_at.isoformat(),
            "services": list(self.services),
            "signals": list(self.signals),
            "severity": self.severity,
            "window_count": self.window_count
        }

class IncidentManager:
    _instance = None
    
    def __init__(self):
        self.active_incident: Optional[Incident] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = IncidentManager()
        return cls._instance

    def get_current(self) -> Optional[Dict[str, Any]]:
        """Returns the active incident if it exists."""
        if self.active_incident:
            return self.active_incident.to_dict()
        return None

    def update(self, anomaly_result: Dict[str, Any], affected_services: List[str], now: datetime):
        """
        Updates the incident state based on anomaly detection results.
        """
        is_anomaly = anomaly_result.get("anomaly", False)
        current_signals = set(anomaly_result.get("signals", []))
        affected_services_set = set(affected_services)

        # 1. Manage existing incident (Timeout Check)
        if self.active_incident:
             # Check if we naturally timed out (no signals for N windows)
             # But valid signals extend the life, so we check this first?
             # Actually, if we have an anomaly NOW, we might extend it.
             # If we DO NOT have an anomaly, we check if we should resolve.
             pass

        # 2. Logic Flow
        if is_anomaly:
            if self.active_incident:
                # Check correlation
                if is_correlated(self.active_incident.last_seen_at, now):
                    # ONGOING Update
                    if self.active_incident.status == "RESOLVED":
                        # If it was resolved but a new anomaly comes in QUICKLY (though resolved means implied timeout)
                        # The logic says: "New anomaly after resolve -> new incident_id"
                        # "Transitions: RESOLVED -> no signals for N windows"
                        # So if it IS resolved, it means it already timed out. So this must be a NEW incident.
                        self._create_new_incident(affected_services_set, current_signals, now)
                    else:
                        # Truly ONGOING
                        self.active_incident.status = "ONGOING"
                        self.active_incident.last_seen_at = now
                        self.active_incident.services.update(affected_services_set)
                        self.active_incident.signals.update(current_signals)
                        self.active_incident.severity = calculate_severity(self.active_incident.signals)
                        self.active_incident.window_count += 1
                else:
                    # Too much time passed (though anomaly logic usually runs every minute, so this is rare if we check often)
                    # But if we missed checks, treat as new.
                    self._create_new_incident(affected_services_set, current_signals, now)
            else:
                # No active incident -> Create NEW
                self._create_new_incident(affected_services_set, current_signals, now)
        
        else:
            # NO Anomaly detected
            if self.active_incident and self.active_incident.status != "RESOLVED":
                # Check timeout
                time_since_last = (now - self.active_incident.last_seen_at).total_seconds()
                if time_since_last > INCIDENT_RESOLUTION_TIMEOUT:
                    self.active_incident.status = "RESOLVED"
                    # We keep it as active_incident so it can be returned by API, 
                    # but next anomaly will trigger a NEW one.

    def _create_new_incident(self, services: Set[str], signals: Set[str], now: datetime):
        self.active_incident = Incident(services, signals, now)
