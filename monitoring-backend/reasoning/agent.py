import os
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import google.generativeai as genai

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
    confidence: float
    uncertainty_notes: Optional[str] = None

class ReasoningAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-001") # Using a standard performant model
        else:
            self.model = None
            print("WARNING: GEMINI_API_KEY not found. Reasoning Agent will be limited.")

    def analyze_incident(self, current_incident: Dict[str, Any], similar_incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main entry point to reason about an incident.
        """
        # 1. Deterministic Confidence
        base_confidence = self._calculate_deterministic_confidence(current_incident, similar_incidents)

        # 2. LLM Reasoning
        if not self.model:
            return {
                "hypothesis": "LLM not configured.",
                "evidence": "N/A",
                "recommended_actions": [],
                "confidence": base_confidence,
                "uncertainty_notes": "Missing API Key"
            }

        llm_response = self._call_llm(current_incident, similar_incidents)

        # 3. Combine Confidence
        # Allow LLM to adjust slightly based on its uncertainty analysis, but clamp it.
        # However, for this implementation, we will use the base confidence as the anchor 
        # and if the LLM expresses high uncertainty, we reduce it.
        # The prompt asks for a confidence score from the LLM too, we can blend them.
        
        # User requirement: "Final confidence is clamped: final_confidence = clamp(confidence_base + llm_adjustment, 0, 1)"
        # We need to extract the confidence (if any) or uncertainty from LLM to formulate an adjustment.
        # Our prompt format asks for "Uncertainty Notes". It doesn't explicitly ask for a numeric adjustment 
        # in the plain text sections, but the "Input Contract" requirement said "Confidence Score 0.0 -> 1.0"
        # and "Provide a confidence score" in the prompt task.
        
        # Let's extract the confidence score from the LLM text if present, or infer it.
        # Actually, the user PROMPT template says "4. Provide a confidence score".
        # So I should parse that too.
        
        llm_confidence_val = llm_response.get("llm_confidence", base_confidence)
        
        # Simple Logic: Avg base and LLM, or use LLM as delta. 
        # The user example: confidence_base + llm_adjustment.
        # Let's assume LLM gives a raw score, and we treat (llm_score - 0.5) * 0.2 as adjustment?
        # Or just average them? 
        # User said: "LLM may: slightly adjust (±0.1)". 
        # Let's take the LLM's confidence, compare to base. If LLM is way higher, boost base slightly.
        # If LLM is lower, penalize.
        
        adjustment = (llm_confidence_val - base_confidence) * 0.5 # dampen the LLM's opinion
        # Clamp adjustment to +/- 0.1 as per "slightly adjust" hint
        adjustment = max(-0.1, min(0.1, adjustment))
        
        final_confidence = max(0.0, min(1.0, base_confidence + adjustment))

        return {
            "hypothesis": llm_response["hypothesis"],
            "evidence": llm_response["evidence"],
            "recommended_actions": llm_response["recommended_actions"],
            "confidence": round(final_confidence, 2),
            "uncertainty_notes": llm_response.get("uncertainty_notes")
        }

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
        Calls Gemini with strict prompt and parses plain text response.
        """
        system_prompt = """You are an incident analysis assistant.
You must only reason using the provided incident data.
If information is insufficient, say so.
Do not guess root causes.
Provide confidence as a number between 0 and 1.
Output format must be strictly sections:
Hypothesis: ...
Evidence: ...
Recommended Actions:
- Action 1
- Action 2
Uncertainty Notes: ...
Confidence Score: ..."""

        import json
        # Filter similar incidents to minimal fields to save context and avoid leakage
        min_similar = []
        for s in similar:
            min_similar.append({
                "incident_id": s.get("incident_id"),
                "signals": s.get("signals"),
                "services": s.get("services"),
                "resolution": s.get("resolution"),
                "severity": s.get("severity")
            })

        user_prompt = f"""Current Incident:
{json.dumps(current, indent=2)}

Similar Past Incidents:
{json.dumps(min_similar, indent=2)}

Task:
1. Provide a likely hypothesis
2. Explain which signals and similarities support it
3. Suggest recommended actions
4. Provide a confidence score
"""

        try:
            response = self.model.generate_content([system_prompt, user_prompt])
            text = response.text
            return self._parse_llm_response(text)
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "hypothesis": "Error calling reasoning engine.",
                "evidence": "N/A",
                "recommended_actions": [],
                "uncertainty_notes": str(e),
                "llm_confidence": 0.0
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
