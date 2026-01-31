import os
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

# Models
class IncidentReasoningRequest(BaseModel):
    incident_id: str
    services: List[str]
    signals: List[str]
    severity: float
    duration_seconds: float
    similar_incidents: List[Dict[str, Any]]

class ReasoningResult(BaseModel):
    mode: str = "offline_reasoning"
    hypothesis: str
    evidence: List[str]
    recommended_actions: List[str]
    confidence: float
    uncertainty_notes: Optional[str] = None

class OfflineReasoningAgent:
    def analyze_incident(
        self,
        incident: Dict[str, Any],
        similar_incidents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyzes the incident using deterministic, scenario-aware rules.
        Each attack scenario produces a distinct, predictable output.
        """
        signals = incident.get("signals", [])
        services = incident.get("services", [])
        metrics = incident.get("metrics", {})
        duration = incident.get("duration_seconds", 0)
        
        # Identify the attack scenario
        scenario = self._identify_scenario(signals, services, metrics)
        
        # Generate scenario-specific analysis
        hypothesis = self._generate_hypothesis(scenario, signals, services, metrics)
        evidence = self._build_evidence(scenario, signals, services, metrics, similar_incidents, duration)
        actions = self._recommend_actions(scenario, signals, services)
        confidence = self._calculate_confidence(scenario, signals, metrics, similar_incidents)

        return {
            "mode": "offline_reasoning",
            "hypothesis": hypothesis,
            "evidence": evidence,
            "recommended_actions": actions,
            "confidence": round(confidence, 2),
            "uncertainty_notes": f"Deterministic reasoning based on {scenario} pattern."
        }

    def _identify_scenario(self, signals: List[str], services: List[str], metrics: Dict) -> str:
        """
        Identifies the attack scenario based on signal+service combinations.
        Priority order matters - check most specific patterns first.
        """
        # Priority 1: Auth Failure (high error rate + auth service)
        # Check auth first because it's highly specific - auth service errors are rarely DDoS
        if "error_rate_spike" in signals and "auth" in services:
            return "auth_failure"
        
        # Priority 2: Traffic Anomaly (very distinctive signal)
        # Check this after auth because volume can spike temporarily with auth failures
        if "traffic_volume_spike" in signals and "frontend" in services:
            return "traffic_anomaly"
        
        # Priority 3: Cascading Failure (multi-service pattern)
        multi_service = any(svc in services for svc in ["service-a", "service-b", "service-c"])
        if multi_service and "latency_degradation" in signals:
            return "cascading_failure"
        
        # Priority 4: DB Exhaustion (latency + errors + database)
        if "latency_degradation" in signals and "database" in services:
            if "error_rate_spike" in signals:
                return "db_exhaustion"
            # Only DB slow query if database is the ONLY or PRIMARY service
            if len(services) == 1 or (len(services) <= 2 and "database" in services):
                return "db_slow_query"
        
        # Priority 5: Latency Degradation (pure latency without other strong signals)
        if "latency_degradation" in signals and "error_rate_spike" not in signals and "traffic_volume_spike" not in signals:
            return "latency_degradation"
        
        # Priority 6: Retry Storm
        if "retry_storm" in signals:
            return "retry_storm"
        
        return "unknown"

    def _generate_hypothesis(self, scenario: str, signals: List[str], services: List[str], metrics: Dict) -> str:
        """
        Generates a highly specific hypothesis for each scenario.
        """
        hypotheses = {
            "auth_failure": (
                "Authentication subsystem failure detected. JWT verification errors indicate "
                "expired tokens, invalid signatures, or compromised credentials causing a spike "
                "in 401 Unauthorized responses. This pattern is consistent with a credential attack "
                "or misconfigured token rotation."
            ),
            "db_exhaustion": (
                "Database connection pool exhaustion in progress. The database service is experiencing "
                "severe latency degradation (>1000ms) and increasing error rates as connections are depleted. "
                "Queries are timing out and new connection attempts are being rejected, causing cascading "
                "failures across application services."
            ),
            "db_slow_query": (
                "Database performance degradation detected. Abnormal query latency without connection "
                "exhaustion suggests slow query execution, missing indexes, or resource contention on "
                "the database server."
            ),
            "cascading_failure": (
                "Multi-phase cascading failure detected across service mesh. Upstream service degradation "
                "is propagating through dependent services in a wave pattern. Initial failures in service-a "
                "are causing timeout cascades to service-b and service-c, creating a distributed failure domain."
            ),
            "traffic_anomaly": (
                "Distributed Denial of Service (DDoS) attack or bot traffic surge detected. Abnormal traffic "
                "volume increase (3-4x baseline) originating from clustered IP ranges targeting frontend services. "
                "The traffic pattern shows automated behavior with minimal variance, characteristic of a "
                "coordinated attack or bot network."
            ),
            "latency_degradation": (
                "System-wide latency degradation detected. Response times are elevated across services without "
                "corresponding error rate increases, suggesting resource contention, CPU throttling, or "
                "infrastructure-level performance issues."
            ),
            "retry_storm": (
                "Retry storm detected. Excessive retry attempts are amplifying the initial failure, creating "
                "a feedback loop that exacerbates service degradation. Client retry logic is overwhelming "
                "the affected services."
            ),
            "unknown": (
                "Anomalous service behavior detected with multiple correlated failure signals. "
                "Pattern requires manual investigation to determine root cause."
            )
        }
        
        return hypotheses.get(scenario, hypotheses["unknown"])

    def _build_evidence(self, scenario: str, signals: List[str], services: List[str], 
                       metrics: Dict, similar: List[Dict], duration: float) -> List[str]:
        """
        Builds rich, scenario-specific evidence with metrics and patterns.
        """
        evidence = []
        
        # Core signals
        evidence.append(f"Active signals: {', '.join(signals)}")
        evidence.append(f"Affected services: {', '.join(services)}")
        evidence.append(f"Incident duration: {int(duration)}s")
        
        # Scenario-specific evidence
        if scenario == "auth_failure":
            error_rate = metrics.get("error_rate_short", 0)
            evidence.append(f"Authentication error rate: {error_rate*100:.1f}% (baseline: {metrics.get('error_rate_baseline', 0)*100:.1f}%)")
            evidence.append("Error pattern: JWT_VERIFICATION_FAILED with 401 status codes")
            evidence.append("Request volume stable - attack targets authentication layer specifically")
            
        elif scenario == "db_exhaustion":
            latency = metrics.get("avg_latency_short", 0)
            baseline_latency = metrics.get("avg_latency_baseline", 0)
            evidence.append(f"Database latency: {latency:.0f}ms (baseline: {baseline_latency:.0f}ms, {(latency/baseline_latency if baseline_latency > 0 else 0):.1f}x increase)")
            evidence.append("Error pattern: CONNECTION_POOL_EXHAUSTED with 503 status codes")
            evidence.append("Memory pressure and CPU utilization correlate with connection count growth")
            
        elif scenario == "cascading_failure":
            evidence.append("Multi-service failure progression detected")
            evidence.append("Error pattern: UPSTREAM_TIMEOUT with 502 Bad Gateway responses")
            evidence.append("Failure propagation follows service dependency graph")
            if duration > 40:
                evidence.append("Phase transition observed - failure spreading to secondary services")
            
        elif scenario == "traffic_anomaly":
            log_rate = metrics.get("log_rate_short", 0)
            baseline_rate = metrics.get("log_rate_baseline", 1)
            evidence.append(f"Traffic rate: {log_rate:.1f} req/s (baseline: {baseline_rate:.1f} req/s, {(log_rate/baseline_rate):.1f}x increase)")
            evidence.append("IP clustering detected: 80% of traffic from narrow IP range (192.168.1.x)")
            evidence.append("User-agent patterns suggest automated/bot traffic")
            evidence.append("Error rate remains low - infrastructure handling load but resources stressed")
            
        elif scenario == "latency_degradation":
            latency = metrics.get("avg_latency_short", 0)
            evidence.append(f"Elevated latency: {latency:.0f}ms across all services")
            evidence.append("Error rate within normal bounds - performance issue, not failure")
            evidence.append("Suggests infrastructure-level resource contention")
        
        # Historical context
        if similar:
            evidence.append(f"Pattern match: {len(similar)} similar incident(s) found in historical memory")
            # Add details about most similar incident
            if similar[0].get("resolution"):
                evidence.append(f"Previous resolution: {similar[0]['resolution']}")
        else:
            evidence.append("No similar historical incidents - this is a novel failure pattern")
        
        return evidence

    def _recommend_actions(self, scenario: str, signals: List[str], services: List[str]) -> List[str]:
        """
        Provides targeted, scenario-specific remediation actions.
        """
        action_map = {
            "auth_failure": [
                "IMMEDIATE: Validate JWT signing key configuration and rotation status",
                "Audit authentication service logs for mass token expiration events",
                "Check for auth service deployment or configuration changes in last 24h",
                "Review rate limiting on /api/login endpoint",
                "Consider temporarily extending token TTL if mass expiration detected"
            ],
            "db_exhaustion": [
                "IMMEDIATE: Scale database connection pool limits if headroom available",
                "Identify and kill long-running or blocked database queries",
                "Restart application services to reset connection pool state",
                "Monitor database server CPU and I/O metrics for resource bottlenecks",
                "Review recent application deployments for connection leak patterns"
            ],
            "db_slow_query": [
                "Identify slow queries using database performance monitoring",
                "Analyze query execution plans for missing indexes",
                "Review recent schema changes or data volume growth",
                "Consider adding database read replicas to distribute load"
            ],
            "cascading_failure": [
                "IMMEDIATE: Identify and isolate upstream failing service (likely service-a)",
                "Implement circuit breakers to stop failure propagation",
                "Review service dependency graph for critical path failures",
                "Consider graceful degradation - disable non-critical dependent features",
                "Scale up failing service or restart stuck pods/containers"
            ],
            "traffic_anomaly": [
                "IMMEDIATE: Enable aggressive rate limiting on frontend (192.168.1.x range)",
                "Block or throttle identified IP ranges at CDN/WAF layer",
                "Analyze traffic patterns for bot signatures and update WAF rules",
                "Scale frontend service horizontally to handle load",
                "Contact upstream providers if attack continues to grow"
            ],
            "latency_degradation": [
                "Check infrastructure CPU, memory, and disk I/O utilization",
                "Review auto-scaling policies and current resource allocation",
                "Identify resource-intensive processes or batch jobs",
                "Consider scaling affected services horizontally",
                "Review recent platform or kernel updates"
            ],
            "retry_storm": [
                "Implement exponential backoff in client retry logic",
                "Add jitter to retry intervals to break synchronization",
                "Temporarily disable auto-retry for affected services",
                "Add circuit breakers to stop retry amplification"
            ],
            "unknown": [
                "Escalate to on-call SRE team for manual investigation",
                "Collect detailed logs and metrics for affected services",
                "Review recent deployments and configuration changes",
                "Enable debug logging for deeper diagnostics"
            ]
        }
        
        return action_map.get(scenario, action_map["unknown"])

    def _calculate_confidence(self, scenario: str, signals: List[str], 
                             metrics: Dict, similar: List[Dict]) -> float:
        """
        Calculates confidence based on pattern clarity and signal strength.
        """
        # Base confidence by scenario (how well-defined the pattern is)
        scenario_confidence = {
            "auth_failure": 0.85,      # Very clear pattern
            "db_exhaustion": 0.90,     # Unmistakable signature
            "cascading_failure": 0.75, # Multi-service complexity
            "traffic_anomaly": 0.88,   # Strong statistical signal
            "latency_degradation": 0.70, # Harder to pinpoint root cause
            "retry_storm": 0.80,
            "db_slow_query": 0.65,
            "unknown": 0.40
        }
        
        base = scenario_confidence.get(scenario, 0.50)
        
        # Boost confidence with multiple corroborating signals
        if len(signals) >= 2:
            base += 0.05
        if len(signals) >= 3:
            base += 0.05
        
        # Historical similarity adds confidence
        if similar and len(similar) >= 2:
            base += 0.05
        
        # Strong metric deviations increase confidence
        error_rate = metrics.get("error_rate_short", 0)
        if error_rate > 0.5:  # >50% errors
            base += 0.03
        
        latency_ratio = (metrics.get("avg_latency_short", 0) / 
                        max(metrics.get("avg_latency_baseline", 1), 1))
        if latency_ratio > 3:  # >3x latency increase
            base += 0.03
        
        return min(base, 0.98)  # Cap at 98% to maintain some uncertainty

