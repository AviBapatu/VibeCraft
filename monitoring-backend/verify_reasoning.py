import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

# Add path
sys.path.append(os.getcwd())

from reasoning.agent import ReasoningAgent

class TestReasoningAgent(unittest.TestCase):
    def setUp(self):
        self.agent = ReasoningAgent()
        # Mock the Gemini Model
        self.agent.model = MagicMock()

    def test_deterministic_confidence(self):
        current = {
            "signals": ["cpu_spike", "error_rate"],
            "services": ["auth"],
            "severity": 0.8
        }
        similar = [{
            "signals": ["cpu_spike"],
            "services": ["auth"],
            "severity": 0.7
        }]
        
        # Overlap:
        # Signals: 1/2 = 0.5 -> 0.4 * 0.5 = 0.2
        # Services: 1/1 = 1.0 -> 0.3 * 1.0 = 0.3
        # Severity: 1 - |0.8 - 0.7| = 0.9 -> 0.3 * 0.9 = 0.27
        # Total: 0.2 + 0.3 + 0.27 = 0.77
        
        conf = self.agent._calculate_deterministic_confidence(current, similar)
        self.assertAlmostEqual(conf, 0.77, places=2)

    def test_llm_parsing(self):
        mock_response = MagicMock()
        mock_response.text = """
Hypothesis: The auth service is overloaded.
Evidence: High cpu and error rates match previous incidents.
Recommended Actions:
- Scale up auth
- Rotate keys
Uncertainty Notes: specific error logs missing.
Confidence Score: 0.85
"""
        self.agent.model.generate_content.return_value = mock_response
        
        current = {"signals": [], "services": [], "window_count": 10, "duration_seconds": 100}
        similar = []
        
        result = self.agent.analyze_incident(current, similar)
        
        self.assertEqual(result["hypothesis"], "The auth service is overloaded.")
        self.assertEqual(len(result["recommended_actions"]), 2)
        self.assertIn("Scale up auth", result["recommended_actions"])
        self.assertEqual(result["uncertainty_notes"], "specific error logs missing.")
        
        # Test confidence blending
        # Base confidence with 0 similar is 0.1
        # LLM confidence is 0.85
        # Adjustment = (0.85 - 0.1) * 0.5 = 0.375 -> Clamped to 0.1
        # Final = 0.1 + 0.1 = 0.2
        
        self.assertAlmostEqual(result["final_confidence"], 0.48, places=2)

if __name__ == "__main__":
    unittest.main()
