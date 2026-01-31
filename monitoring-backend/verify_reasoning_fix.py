import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

from reasoning.agent import ReasoningAgent

def test_reasoning():
    print("Initializing ReasoningAgent...")
    agent = ReasoningAgent()
    
    if not agent.client:
        print("FAILED: Agent client not initialized.")
        return

    print("Agent initialized successfully.")
    print(f"Model Name: {agent.model_name}")

    # Dummy incident
    current_incident = {
        "incident_id": "test-123",
        "signals": ["traffic_volume_spike", "latency_degradation"],
        "services": ["database", "web-server"],
        "severity": 0.8,
        "duration_seconds": 120,
        "window_count": 5
    }

    similar_incidents = []

    print("\nCalling analyze_incident...")
    try:
        result = agent.analyze_incident(current_incident, similar_incidents)
        print("\nResult:")
        print(result)
        
        if result.get("hypothesis") != "Unknown":
            print("\nSUCCESS: Reasoning agent returned a hypothesis.")
        else:
            print("\nWARNING: Reasoning agent returned 'Unknown'. check logs.")

    except Exception as e:
        print(f"\nExample failed with error: {e}")

if __name__ == "__main__":
    test_reasoning()
