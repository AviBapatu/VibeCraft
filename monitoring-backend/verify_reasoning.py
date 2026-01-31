import sys
import os
import unittest
from unittest.mock import MagicMock

# Add path
sys.path.append(os.getcwd())

from reasoning.agent import OfflineReasoningAgent as ReasoningAgent

class TestReasoningAgent(unittest.TestCase):
    def setUp(self):
        self.agent = ReasoningAgent()

    def test_calculate_confidence(self):
        # Base 0.5 + 0.1 * len(signals) + 0.2 (if similar)
        # 2 signals, similar exists -> 0.5 + 0.2 + 0.2 = 0.9
        signals = ["cpu_spike", "error_rate"]
        similar = [{"id": "123"}]
        
        conf = self.agent._calculate_confidence(signals, similar)
        self.assertAlmostEqual(conf, 0.9)

        # 0 signals, no similar -> 0.5 + 0.0 + 0.0 = 0.5
        conf = self.agent._calculate_confidence([], [])
        self.assertEqual(conf, 0.5)

    def test_analyze_incident_auth(self):
        current = {
            "signals": ["error_rate_spike"],
            "services": ["auth"],
            "severity": 0.8
        }
        similar = []
        
        result = self.agent.analyze_incident(current, similar)
        
        self.assertEqual(result["mode"], "offline_reasoning")
        self.assertIn("Authentication subsystem failure", result["hypothesis"])
        self.assertIn("Rotate authentication secrets", result["recommended_actions"][0])
        # Conf: 0.5 + 0.1(1) = 0.6
        self.assertEqual(result["final_confidence"], 0.6)

    def test_analyze_incident_db_latency(self):
        current = {
            "signals": ["latency_degradation"],
            "services": ["database"],
            "severity": 0.8
        }
        similar = [{"id": "1"}]
        
        result = self.agent.analyze_incident(current, similar)
        
        self.assertIn("Database contention", result["hypothesis"])
        # Conf: 0.5 + 0.1(1) + 0.2 = 0.8
        self.assertEqual(result["final_confidence"], 0.8)
        self.assertTrue(isinstance(result["evidence"], list))
        self.assertEqual(len(result["evidence"]), 3) # signals, services, similar count

if __name__ == "__main__":
    unittest.main()
