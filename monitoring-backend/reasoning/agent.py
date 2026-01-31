import os
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import google.generativeai as genai

# DEBUG: Check API Key on Import
api_key = os.getenv("GEMINI_API_KEY")
print("Using GEMINI_API_KEY:", (api_key[:12] if api_key else "None"), "****")

# Models
class IncidentReasoningRequest(BaseModel):
    incident_id: str
    services: List[str]
    signals: List[str]
    severity: float
    duration_seconds: float
    similar_incidents: List[Dict[str, Any]]

class ReasoningResult(BaseModel):
    hypothesis: str
    evidence: str
    recommended_actions: List[str]
    final_confidence: float
    uncertainty_notes: Optional[str] = None

class ReasoningAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        try:
            if self.api_key:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-2.0-flash") # Using a standard performant model
            else:
                self.model = None
                print("WARNING: GEMINI_API_KEY not found. Reasoning Agent will be limited.")
        except Exception as e:
            print(f"GenAI Init Error: {e}")
            self.model = None

    def _infer_primary_cause(self, signals: List[str], services: List[str]) -> str:
        """
        FIX 1: Deterministic Primary Cause
        """
        if "traffic_volume_spike" in signals and "latency_degradation" in signals:
            if "database" in services:
                return "Database saturation or connection exhaustion"

        # FIX 3: Cascading Failure (Auth -> DB Latency)
        # If we see auth errors AND latency, it might be cascading
        if "error_rate_spike" in signals and "auth" in services:
             if "latency_degradation" in signals:
                 return "Cascading failure: Auth failure triggering database latency"
             return "Authentication failure"

        return "System performance degradation"

    def analyze_incident(self, current_incident: Dict[str, Any], similar_incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main entry point to reason about an incident.
        """
        # FIX: Debug Logging (Proof of fix)
        print("=== REASONING INPUT ===")
        print("Signals:", current_incident.get("signals"))
        print("Services:", current_incident.get("services"))
        print("Metrics:", current_incident.get("metrics") if "metrics" in current_incident else None)
        print("=======================")

        # FIX 4: Delay reasoning until incident stabilizes
        # Using .get because dict might be passed, defaulting to 0 safety
        window_count = current_incident.get("window_count", 0)
        duration_seconds = current_incident.get("duration_seconds", 0)
        
        if window_count < 3 and duration_seconds < 30:
            return {
                "hypothesis": "Waiting for stable signals...",
                "evidence": f"Incident detection window {window_count} < 3 or duration {duration_seconds}s < 30s.",
                "recommended_actions": ["Wait for more data"],
                "final_confidence": 0.0,
                "uncertainty_notes": "WAITING_FOR_STABLE_SIGNALS"
            }

        return self._call_llm(current_incident, similar_incidents)

    def _calculate_deterministic_confidence(self, current: Dict[str, Any], similar: List[Dict[str, Any]]) -> float:
        if not similar:
            return 0.1 # Very low confidence if no history
        
        # Take the top match
        top_match = similar[0]
        
        # Signal Overlap
        curr_signals = set(current.get("signals", []))
        top_signals = set(top_match.get("signals", []))
        if not curr_signals:
            signal_overlap = 0.0
        else:
            signal_overlap = len(curr_signals.intersection(top_signals)) / len(curr_signals.union(top_signals))

        # Service Overlap
        curr_services = set(current.get("services", []))
        top_services = set(top_match.get("services", []))
        if not curr_services:
            service_overlap = 0.0
        else:
            service_overlap = len(curr_services.intersection(top_services)) / len(curr_services.union(top_services))
            
        # Severity Match
        # Assume severity is float or string. If string HIGH/MEDIUM/LOW, map to numbers?
        # IncidentManager calculates severity as float.
        curr_sev = float(current.get("severity", 0))
        top_sev = float(top_match.get("severity", 0))
        # Similarity in severity (1 - diff)
        sev_match = max(0, 1.0 - abs(curr_sev - top_sev))

        # Weights from user example
        # 0.4 * signal + 0.3 * service + 0.3 * severity
        confidence = (0.4 * signal_overlap) + (0.3 * service_overlap) + (0.3 * sev_match)
        return confidence

    def _call_llm(self, current: Dict[str, Any], similar: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Real LLM call with deterministic guards (FIX 1, 2, 3).
        """
        signals = current.get("signals", [])
        services = current.get("services", [])
        
        # FIX 1: Deterministic Confidence
        base_conf = self._calculate_deterministic_confidence(current, similar)

        # FIX 1: Force primary cause
        primary_cause = self._infer_primary_cause(signals, services)
        
        # FIX 2: Forbid auth (Dominance-based)
        auth_related = (
            "error_rate_spike" in signals and
            "auth" in services
        )

        forbid_auth = False
        if not auth_related:
            forbid_auth = True

        prompt = f"""
        Analyze this system incident and provide a structured response.
        
        CURRENT INCIDENT CONTEXT:
        Signals: {signals}
        Services: {services}
        Metrics: {current.get("metrics", {})}
        
        Primary inferred cause (rule-based): {primary_cause}
        Deterministic confidence based on historical similarity: {base_conf:.2f}
        Use this as a strong prior when reasoning.
        
        SIMILAR PAST INCIDENTS:
        {similar}
        
        INSTRUCTIONS:
        1. Formulate a hypothesis based on the evidence.
        2. Provide specific evidence from the signals.
        3. Recommend actionable steps.
        4. Assign a confidence score (0.0 to 1.0).
        
        You MUST focus your hypothesis on the primary inferred cause unless strong evidence contradicts it.
        Do NOT introduce unrelated subsystems.
        """
        
        if forbid_auth:
            prompt += "\nIMPORTANT:\nDo NOT attribute the issue to authentication unless there is explicit auth failure evidence."

        if "Cascading failure" in primary_cause:
             prompt += "\nIMPORTANT:\nThis looks like a CASCADING FAILURE. The root cause is likely Authentication, but it is causing downstream latency. Explain this relationship."

        prompt += """
        
        FORMAT YOUR RESPONSE EXACTLY AS:
        Hypothesis: ...
        Evidence: ...
        Recommended Actions:
        - ...
        - ...
        Uncertainty Notes: ...
        Confidence Score: 0.X
        """

        if not self.model:
            # Fallback if no API key, but respect primary cause
            return {
                "hypothesis": primary_cause,
                "evidence": f"signals={signals} services={services} (LLM Disabled)",
                "recommended_actions": ["Check logs", "Monitor metrics"],
                "final_confidence": 0.5,
                "uncertainty_notes": "LLM not initialized"
            }

        # Retry logic for Rate Limits
        import time
        import random
        from google.api_core.exceptions import ResourceExhausted

        max_retries = 3
        base_delay = 2

        for attempt in range(max_retries + 1):
            try:
                response = self.model.generate_content(prompt)
                parsed_result = self._parse_llm_response(response.text)
                
                # Blend confidence
                llm_conf = parsed_result.get("llm_confidence", 0.5)
                # Weighted blend: 50% history, 50% LLM
                final_conf = (base_conf * 0.5) + (llm_conf * 0.5)
                
                 # Clamp to 0.1 minimum (unless LLM is very sure it's 0, but usually we trust history)
                final_conf = max(0.1, final_conf)
                
                parsed_result["final_confidence"] = round(final_conf, 2)
                return parsed_result
            
            except ResourceExhausted as e:
                if attempt < max_retries:
                    delay = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
                    print(f"LLM Rate Limit hit. Retrying in {delay:.2f}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    print(f"LLM Rate Limit exhausted after {max_retries} retries.")
                    return {
                        "hypothesis": primary_cause,
                        "evidence": "LLM Rate Limit Exceeded (Quota)",
                        "recommended_actions": ["Check billing/quota", "Try again later"],
                        "final_confidence": 0.5,
                        "uncertainty_notes": "Rate limit exceeded"
                    }

            except Exception as e:
                print(f"LLM Error: {e}")
                return {
                    "hypothesis": primary_cause,
                    "evidence": "LLM generation failed",
                    "recommended_actions": ["Check system manually"],
                    "final_confidence": 0.5,
                    "uncertainty_notes": str(e)
                }

    def _parse_llm_response(self, text: str) -> Dict[str, Any]:
        """
        Parses the plain text sections from LLM.
        """
        result = {
            "hypothesis": "Unknown",
            "evidence": "None",
            "recommended_actions": [],
            "uncertainty_notes": "",
            "llm_confidence": 0.5
        }

        # Regex for sections
        hypothesis_match = re.search(r"Hypothesis:\s*(.*?)(?=\nEvidence:|\nRecommended Actions:|\nUncertainty Notes:|\nConfidence Score:|$)", text, re.DOTALL | re.IGNORECASE)
        if hypothesis_match:
            result["hypothesis"] = hypothesis_match.group(1).strip()

        evidence_match = re.search(r"Evidence:\s*(.*?)(?=\nRecommended Actions:|\nUncertainty Notes:|\nConfidence Score:|$)", text, re.DOTALL | re.IGNORECASE)
        if evidence_match:
            result["evidence"] = evidence_match.group(1).strip()

        actions_match = re.search(r"Recommended Actions:\s*(.*?)(?=\nUncertainty Notes:|\nConfidence Score:|$)", text, re.DOTALL | re.IGNORECASE)
        if actions_match:
            actions_blob = actions_match.group(1).strip()
            # Split by newlines and clean bullets
            actions = []
            for line in actions_blob.split('\n'):
                clean = line.strip().lstrip('-').lstrip('*').strip()
                if clean:
                    actions.append(clean)
            result["recommended_actions"] = actions

        uncertainty_match = re.search(r"Uncertainty Notes:\s*(.*?)(?=\nConfidence Score:|$)", text, re.DOTALL | re.IGNORECASE)
        if uncertainty_match:
            result["uncertainty_notes"] = uncertainty_match.group(1).strip()
            
        confidence_match = re.search(r"Confidence Score:\s*([\d\.]+)", text, re.IGNORECASE)
        if confidence_match:
            try:
                result["llm_confidence"] = float(confidence_match.group(1))
            except:
                pass

        return result
