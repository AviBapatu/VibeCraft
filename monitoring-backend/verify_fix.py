
import os
import sys
# Load env manually
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                try:
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value
                except ValueError:
                    pass

# Add current dir to sys.path
sys.path.append(os.getcwd())
# Also add the directory of the script to sys.path to ensure we can import reasoning
sys.path.append(os.path.dirname(__file__))

# Adjust import path assuming script is in monitoring-backend/
try:
    from reasoning.agent import ReasoningAgent
except ImportError:
    # Try importing with package if running from root
    try:
        from monitoring_backend.reasoning.agent import ReasoningAgent
    except ImportError:
        # Fallback if running from monitoring-backend dir
        sys.path.append(os.getcwd())
        from reasoning.agent import ReasoningAgent

def test_db_exhaustion():
    print("\n--- Testing DB Exhaustion ---")
    agent = ReasoningAgent()
    
    current = {
        "signals": ["traffic_volume_spike", "latency_degradation"],
        "services": ["database", "frontend"],
        "metrics": {"db_connections": 100},
        "window_count": 5, # Stable
        "duration_seconds": 60 
    }
    
    similar = []
    
    result = agent.analyze_incident(current, similar)
    print("Hypothesis:", result.get("hypothesis"))
    
    if "Database" in result.get("hypothesis", ""):
        print("✅ PASS: Correctly identified DB issue")
    else:
        print(f"❌ FAIL: Expected DB issue, got {result.get('hypothesis')}")

def test_auth_failure():
    print("\n--- Testing Auth Failure ---")
    agent = ReasoningAgent()
    
    current = {
        "signals": ["error_rate_spike"],
        "services": ["auth"],
        "metrics": {"error_rate": 0.5},
        "window_count": 5, # Stable
        "duration_seconds": 60
    }
    
    similar = []
    
    result = agent.analyze_incident(current, similar)
    print("Hypothesis:", result.get("hypothesis"))
    
    if "Auth" in result.get("hypothesis", ""):
        print("✅ PASS: Correctly identified Auth issue")
    else:
        print(f"❌ FAIL: Expected Auth issue, got {result.get('hypothesis')}")

def test_db_with_auth_service():
    print("\n--- Testing DB Exhaustion with Auth Service Present (Bias Check) ---")
    agent = ReasoningAgent()
    
    # Auth service is present, but NO error_rate_spike signal.
    # Should NOT attribute to auth.
    current = {
        "signals": ["traffic_volume_spike", "latency_degradation"],
        "services": ["database", "frontend", "auth"],
        "metrics": {"db_connections": 100},
        "window_count": 5, 
        "duration_seconds": 60
    }
    
    similar = []
    
    result = agent.analyze_incident(current, similar)
    print("Hypothesis:", result.get("hypothesis"))
    
    # The fix ensures forbid_auth is True because error_rate_spike is missing.
    # So "Authentication" should NOT be the hypothesis.
    
    if "Database" in result.get("hypothesis", ""):
        print("✅ PASS: Correctly identified DB issue despite auth service presence")
    elif "Auth" in result.get("hypothesis", ""):
        print("❌ FAIL: Incorrectly attributed to Auth (Bias detected)")
    else:
        print(f"⚠️  NOTE: Hypothesis was {result.get('hypothesis')}")

def test_stability_check():
    print("\n--- Testing Stability Check ---")
    agent = ReasoningAgent()
    
    # Case 1: Both small -> Wait
    current_wait = {
        "signals": ["traffic_volume_spike"],
        "services": ["database"],
        "window_count": 2, 
        "duration_seconds": 20
    }
    
    result = agent.analyze_incident(current_wait, [])
    if result.get("final_confidence") == 0.0 and "Waiting" in result.get("hypothesis", ""):
        print("✅ PASS: Correctly delayed reasoning (Both small)")
    else:
        print(f"❌ FAIL: Expected delay for small window/duration, got {result.get('hypothesis')}")

    # Case 2: Window small, Duration large -> Proceed
    current_proceed_duration = {
        "signals": ["traffic_volume_spike"],
        "services": ["database"],
        "window_count": 1,
        "duration_seconds": 40
    }
    # We expect it to TRY to reason (run LLM or fallback), but NOT return "Waiting..."
    # Since we can't easily mock LLM return validation here without API key or mocking,
    # we just check it returns something other than "Waiting for stable signals..."
    result = agent.analyze_incident(current_proceed_duration, [])
    if "Waiting" not in result.get("hypothesis", ""):
        print("✅ PASS: Proceeded with large duration")
    else:
        print(f"❌ FAIL: Should have proceeded (Duration > 30), but got {result.get('hypothesis')}")

    # Case 3: Window large, Duration small -> Proceed
    current_proceed_window = {
        "signals": ["traffic_volume_spike"],
        "services": ["database"],
        "window_count": 4,
        "duration_seconds": 10
    }
    result = agent.analyze_incident(current_proceed_window, [])
    if "Waiting" not in result.get("hypothesis", ""):
        print("✅ PASS: Proceeded with large window count")
    else:
        print(f"❌ FAIL: Should have proceeded (Window > 3), but got {result.get('hypothesis')}")


if __name__ == "__main__":
    test_db_exhaustion()
    test_auth_failure()
    test_db_with_auth_service()
    test_stability_check()
