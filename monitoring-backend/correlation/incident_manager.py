from datetime import datetime, timezone
from typing import Optional, List, Set, Dict, Any, Literal
import uuid
from enum import Enum
from correlation.incident_rules import (
    is_correlated, 
    calculate_severity, 
    INCIDENT_RESOLUTION_TIMEOUT
)
from memory.vector_store import VectorStore
from memory.embedder import Embedder
from debug.pipeline_state import update_state

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ApprovalLockError(Exception):
    """Raised when attempting to modify an already decided approval."""
    pass

class Incident:
    def __init__(self, services: Set[str], signals: Set[str], started_at: datetime, similar_incidents: List[Dict] = None, metrics: Dict = None):
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
        
        # Metrics for reasoning
        self.metrics = metrics if metrics else {}
        
        # Reasoning & Approval
        self.reasoning: Optional[Dict] = None
        self.confidence: float = 0.0
        self.approval = {
            "status": ApprovalStatus.PENDING.value,
            "actor": None,
            "comment": None,
            "decided_at": None
        }
        
        # Remediation (simulated)
        self.remediation = {
            "status": "PENDING",
            "execution_mode": None,
            "executed_at": None
        }

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
            "duration_seconds": (datetime.now(timezone.utc) - self.started_at).total_seconds(),
            "summary_text": self.summary_text,
            "resolution": self.resolution,
            "similar_incidents": self.similar_incidents,
            "metrics": self.metrics,
            "reasoning": self.reasoning,
            "confidence": self.confidence,
            "approval": self.approval,
            "remediation": self.remediation
        }

class IncidentManager:
    _instance = None
    
    def __init__(self):
        self.active_incident: Optional[Incident] = None
        
        # Initialize Embedder and VectorStore
        self.embedder = Embedder()
        self.vector_store = VectorStore(dim=self.embedder.dim)

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

    def reset_demo_state(self):
        """
        DEMO ONLY:
        Explicitly clears active incident and internal state.
        Does NOT write to vector memory.
        """
        self.active_incident = None
        # If we had other stateful timers like 'last_anomaly_seen_at' in the manager, 
        # we would reset them here. Currently state is encapsulated in active_incident.


    def update_reasoning(self, incident_id: str, reasoning: Dict):
        """Attaches reasoning to the active incident."""
        if self.active_incident and self.active_incident.incident_id == incident_id:
            # Add timestamp to reasoning
            if "created_at" not in reasoning:
                reasoning["created_at"] = datetime.utcnow().isoformat()
            
            self.active_incident.reasoning = reasoning
            self.active_incident.confidence = reasoning.get("confidence", 0.0)
            # If we wanted to auto-reject low confidence, we could do it here
            # But per rules, we just store it.

    def approve_incident(self, incident_id: str, actor: str, comment: Optional[str] = None):
        """Approves the incident if validation passes."""
        if not self.active_incident or self.active_incident.incident_id != incident_id:
             raise ValueError(f"Incident {incident_id} not found or not active")
        
        # Lock Check
        if self.active_incident.approval["status"] != ApprovalStatus.PENDING.value:
            raise ApprovalLockError("Approval already decided")

        # Validation Rules
        if not self.active_incident.reasoning:
            raise ValueError("Cannot approve incident without reasoning")
            
        # Check Confidence Threshold
        # Using confidence from incident
        confidence = self.active_incident.confidence
        
        if confidence < 0.6:
             raise ValueError(f"Confidence score {confidence} is below threshold 0.6")

        # Update approval
        self.active_incident.approval = {
            "status": ApprovalStatus.APPROVED.value,
            "actor": actor,
            "comment": comment,
            "decided_at": datetime.utcnow().isoformat(),
            "approved_with_confidence": confidence
        }
        
        # Update remediation (simulated execution)
        self.active_incident.remediation = {
            "status": "EXECUTED",
            "execution_mode": "SIMULATED",
            "executed_at": datetime.utcnow().isoformat()
        }
        
        return self.active_incident.to_dict()

    def reject_incident(self, incident_id: str, actor: str, comment: Optional[str] = None):
        """Rejects the incident."""
        if not self.active_incident or self.active_incident.incident_id != incident_id:
             raise ValueError(f"Incident {incident_id} not found or not active")
        
        # Lock Check
        if self.active_incident.approval["status"] != ApprovalStatus.PENDING.value:
            raise ApprovalLockError("Approval already decided")
        
        # We can reject even without reasoning? Probably yes, explicitly rejecting garbage.
        # But prompt said "Approval is allowed only if reasoning has already been generated"
        # It didn't explicitly restrict rejection. But safe to assume we are rejecting a PROPOSAL.
        # If there is no reasoning/proposal, there is nothing to reject.
        if not self.active_incident.reasoning:
             raise ValueError("Cannot reject incident without reasoning (nothing to reject)")

        self.active_incident.approval = {
            "status": ApprovalStatus.REJECTED.value,
            "actor": actor,
            "comment": comment,
            "decided_at": datetime.utcnow().isoformat()
        }
        return self.active_incident.to_dict()

    def update(self, anomaly_result: Dict[str, Any], affected_services: List[str], now: datetime):
        """
        Updates the incident state based on anomaly detection results.
        """
        update_state(last_incident_update_at=datetime.utcnow().isoformat())

        is_anomaly = anomaly_result.get("anomaly", False)
        current_signals = set(anomaly_result.get("signals", []))
        affected_services_set = set(affected_services)

        # 1. Manage existing incident (Timeout Check)
        if self.active_incident:
             pass

        # 2. Logic Flow
        if is_anomaly:
            metrics = anomaly_result.get("metrics", {})
            if self.active_incident:
                # Check correlation
                if is_correlated(self.active_incident.last_seen_at, now):
                    # ONGOING Update
                    if self.active_incident.status == "RESOLVED":
                        # Resolved -> New anomaly -> New Incident
                        self._create_new_incident(affected_services_set, current_signals, now, metrics)
                    else:
                        # Truly ONGOING
                        self.active_incident.status = "ONGOING"
                        self.active_incident.last_seen_at = now
                        self.active_incident.services.update(affected_services_set)
                        self.active_incident.signals.update(current_signals)
                        self.active_incident.severity = calculate_severity(self.active_incident.signals)
                        self.active_incident.window_count += 1
                        # Update metrics with latest data
                        self.active_incident.metrics = metrics
                else:
                    # Too much time passed -> New Incident
                    self._create_new_incident(affected_services_set, current_signals, now, metrics)
            else:
                # No active incident -> Create NEW
                self._create_new_incident(affected_services_set, current_signals, now, metrics)
        
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
            vector = self.embedder.embed(incident.summary_text)
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

    def _create_new_incident(self, services: Set[str], signals: Set[str], now: datetime, metrics: Dict = None):
        # 1. Draft the potential new incident to generate a query summary
        temp_services_str = ", ".join(services)
        temp_signals_str = ", ".join(signals)
        query_text = f"Incident involving {temp_services_str} with signals {temp_signals_str}"
        
        # 2. Query Memory (Once on creation)
        try:
            query_vector = self.embedder.embed(query_text)
            similar = self.vector_store.search(query_vector, k=3)
            # Guardrail: Exclude self (though this is new, strict safety)
            # Since this is a new object, it has no ID yet that is in the store.
            # But just in case we verify IDs if they existed. 
            pass 
        except Exception as e:
            print(f"Vector search failed: {e}")
            similar = []

        # 3. Create Incident with cached similarity and metrics
        self.active_incident = Incident(services, signals, now, similar_incidents=similar, metrics=metrics)
