from datetime import datetime
from typing import Optional, List, Set, Dict, Any
import uuid
from correlation.incident_rules import (
    is_correlated, 
    calculate_severity, 
    INCIDENT_RESOLUTION_TIMEOUT
)
from memory.vector_store import VectorStore
from memory.embedder import embed

class Incident:
    def __init__(self, services: Set[str], signals: Set[str], started_at: datetime, similar_incidents: List[Dict] = None):
        self.incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        self.status = "OPEN"
        self.started_at = started_at
        self.last_seen_at = started_at
        self.services = services
        self.signals = signals
        self.severity = calculate_severity(signals)
        self.window_count = 1
        
        # Memory / Vector fields
        self.summary_text = ""
        self.resolution = ""
        self.resolved_at: Optional[datetime] = None
        self.similar_incidents = similar_incidents if similar_incidents else []

    def to_dict(self):
        return {
            "incident_id": self.incident_id,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "last_seen_at": self.last_seen_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "services": list(self.services),
            "signals": list(self.signals),
            "severity": self.severity,
            "window_count": self.window_count,
            "summary_text": self.summary_text,
            "resolution": self.resolution,
            "similar_incidents": self.similar_incidents
        }

class IncidentManager:
    _instance = None
    
    def __init__(self):
        self.active_incident: Optional[Incident] = None
        self.vector_store = VectorStore() # Initialize vector store (loads from file or empty)

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
             pass

        # 2. Logic Flow
        if is_anomaly:
            if self.active_incident:
                # Check correlation
                if is_correlated(self.active_incident.last_seen_at, now):
                    # ONGOING Update
                    if self.active_incident.status == "RESOLVED":
                        # Resolved -> New anomaly -> New Incident
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
                    # Too much time passed -> New Incident
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
                    self.active_incident.resolved_at = now
                    self.active_incident.resolution = "Traffic subsided automatically" # Default resolution for now
                    self.active_incident.summary_text = self._generate_summary(self.active_incident)
                    
                    # STORE IN VECTOR MEMORY
                    self._store_incident(self.active_incident)
                    
                    # We keep it as active_incident so it can be returned by API, 
                    # but next anomaly will trigger a NEW one.

    def _generate_summary(self, incident: Incident) -> str:
        """Simple template-based summary generator."""
        services_str = ", ".join(incident.services)
        signals_str = ", ".join(incident.signals)
        duration = (incident.last_seen_at - incident.started_at).total_seconds()
        return (f"{incident.severity} severity incident involving {services_str}. "
                f"Signals observed: {signals_str}. Duration: {duration}s. "
                f"Resolved after traffic normalized.")

    def _store_incident(self, incident: Incident):
        """Embeds and stores the resolved incident."""
        try:
            vector = embed(incident.summary_text)
            meta = {
                "incident_id": incident.incident_id,
                "summary_text": incident.summary_text,
                "signals": list(incident.signals),
                "services": list(incident.services),
                "severity": incident.severity,
                "resolution": incident.resolution,
                "resolved_at": incident.resolved_at.isoformat()
            }
            self.vector_store.add(vector, meta)
            print(f"Stored incident {incident.incident_id} in vector memory.")
        except Exception as e:
            print(f"Failed to store incident: {e}")

    def _create_new_incident(self, services: Set[str], signals: Set[str], now: datetime):
        # 1. Draft the potential new incident to generate a query summary
        temp_services_str = ", ".join(services)
        temp_signals_str = ", ".join(signals)
        query_text = f"Incident involving {temp_services_str} with signals {temp_signals_str}"
        
        # 2. Query Memory (Once on creation)
        try:
            query_vector = embed(query_text)
            similar = self.vector_store.search(query_vector, k=3)
            # Guardrail: Exclude self (though this is new, strict safety)
            # Since this is a new object, it has no ID yet that is in the store.
            # But just in case we verify IDs if they existed. 
            pass 
        except Exception as e:
            print(f"Vector search failed: {e}")
            similar = []

        # 3. Create Incident with cached similarity
        self.active_incident = Incident(services, signals, now, similar_incidents=similar)
