#!/usr/bin/env python3
"""
Demo Validation Script for VibeCraft Hackathon

This script validates that each attack scenario produces distinct, predictable
incident analyses for the demo presentation.
"""

from reasoning.agent import OfflineReasoningAgent

def create_test_incident(scenario_name: str, services: list, signals: list, metrics: dict = None):
    """Helper to create a test incident dict."""
    if metrics is None:
        metrics = {}
    
    return {
        "services": services,
        "signals": signals,
        "metrics": metrics,
        "duration_seconds": 60,
        "severity": "HIGH"
    }

def test_auth_failure():
    """Test Auth Failure scenario detection."""
    print("\n=== Testing Auth Failure Scenario ===")
    
    incident = create_test_incident(
        "auth_failure",
        services=["auth"],
        signals=["error_rate_spike"],
        metrics={
            "error_rate_short": 0.55,
            "error_rate_baseline": 0.02,
            "avg_latency_short": 400,
            "avg_latency_baseline": 250
        }
    )
    
    agent = OfflineReasoningAgent()
    result = agent.analyze_incident(incident, [])
    
    print(f"Hypothesis: {result['hypothesis'][:100]}...")
    print(f"Confidence: {result['confidence']}")
    print(f"Key evidence: {result['evidence'][0] if result['evidence'] else 'None'}")
    
    # Assertions
    assert "JWT" in result['hypothesis'] or "Authentication" in result['hypothesis'], "Hypothesis should mention JWT/Auth"
    assert result['confidence'] >= 0.75, f"Confidence {result['confidence']} too low for auth failure"
    assert "401" in str(result['evidence']) or "JWT_VERIFICATION_FAILED" in str(result['evidence']), "Evidence should mention 401 or JWT errors"
    
    print("✅ Auth Failure test PASSED")
    return result

def test_db_exhaustion():
    """Test DB Exhaustion scenario detection."""
    print("\n=== Testing DB Exhaustion Scenario ===")
    
    incident = create_test_incident(
        "db_exhaustion",
        services=["database"],
        signals=["error_rate_spike", "latency_degradation"],
        metrics={
            "error_rate_short": 0.70,
            "error_rate_baseline": 0.02,
            "avg_latency_short": 1500,
            "avg_latency_baseline": 400
        }
    )
    
    agent = OfflineReasoningAgent()
    result = agent.analyze_incident(incident, [])
    
    print(f"Hypothesis: {result['hypothesis'][:100]}...")
    print(f"Confidence: {result['confidence']}")
    print(f"Key evidence: {result['evidence'][0] if result['evidence'] else 'None'}")
    
    # Assertions
    assert "connection" in result['hypothesis'].lower() or "database" in result['hypothesis'].lower(), "Hypothesis should mention connection/database"
    assert result['confidence'] >= 0.80, f"Confidence {result['confidence']} too low for DB exhaustion"
    assert "503" in str(result['evidence']) or "CONNECTION_POOL" in str(result['evidence']), "Evidence should mention 503 or connection pool"
    
    print("✅ DB Exhaustion test PASSED")
    return result

def test_cascading_failure():
    """Test Cascading Failure scenario detection."""
    print("\n=== Testing Cascading Failure Scenario ===")
    
    incident = create_test_incident(
        "cascading_failure",
        services=["service-a", "service-b"],
        signals=["latency_degradation", "error_rate_spike"],
        metrics={
            "error_rate_short": 0.50,
            "error_rate_baseline": 0.02,
            "avg_latency_short": 1800,
            "avg_latency_baseline": 300
        }
    )
    
    agent = OfflineReasoningAgent()
    result = agent.analyze_incident(incident, [])
    
    print(f"Hypothesis: {result['hypothesis'][:100]}...")
    print(f"Confidence: {result['confidence']}")
    print(f"Key evidence: {result['evidence'][0] if result['evidence'] else 'None'}")
    
    # Assertions
    assert "cascad" in result['hypothesis'].lower() or "upstream" in result['hypothesis'].lower(), "Hypothesis should mention cascading/upstream"
    assert result['confidence'] >= 0.70, f"Confidence {result['confidence']} too low for cascading failure"
    assert "service-a" in str(result['evidence']) or "service-b" in str(result['evidence']), "Evidence should mention affected services"
    
    print("✅ Cascading Failure test PASSED")
    return result

def test_traffic_anomaly():
    """Test Traffic Anomaly (DDoS) scenario detection."""
    print("\n=== Testing Traffic Anomaly Scenario ===")
    
    incident = create_test_incident(
        "traffic_anomaly",
        services=["frontend"],
        signals=["traffic_volume_spike"],
        metrics={
            "error_rate_short": 0.01,
            "error_rate_baseline": 0.01,
            "log_rate_short": 180,
            "log_rate_baseline": 50,
            "avg_latency_short": 250,
            "avg_latency_baseline": 200
        }
    )
    
    agent = OfflineReasoningAgent()
    result = agent.analyze_incident(incident, [])
    
    print(f"Hypothesis: {result['hypothesis'][:100]}...")
    print(f"Confidence: {result['confidence']}")
    print(f"Key evidence: {result['evidence'][0] if result['evidence'] else 'None'}")
    
    # Assertions
    assert "ddos" in result['hypothesis'].lower() or "bot" in result['hypothesis'].lower() or "traffic" in result['hypothesis'].lower(), "Hypothesis should mention DDoS/bot/traffic"
    assert result['confidence'] >= 0.80, f"Confidence {result['confidence']} too low for traffic anomaly"
    assert "192.168.1" in str(result['evidence']) or "IP" in str(result['evidence']), "Evidence should mention IP clustering"
    
    print("✅ Traffic Anomaly test PASSED")
    return result

def verify_uniqueness(results: dict):
    """Verify that all scenarios produce unique hypotheses."""
    print("\n=== Verifying Hypothesis Uniqueness ===")
    
    hypotheses = {name: result['hypothesis'] for name, result in results.items()}
    
    # Check that no two hypotheses are identical
    unique_hypotheses = set(hypotheses.values())
    assert len(unique_hypotheses) == len(hypotheses), "❌ Some scenarios have identical hypotheses!"
    
    # Check that each has distinctive keywords
    for name, hypothesis in hypotheses.items():
        print(f"{name}: {hypothesis[:80]}...")
    
    print(f"\n✅ All {len(results)} scenarios have UNIQUE hypotheses")

def main():
    """Run all validation tests."""
    print("=" * 70)
    print("VibeCraft Demo Validation - Attack Scenario Distinctiveness")
    print("=" * 70)
    
    results = {}
    
    try:
        results['auth_failure'] = test_auth_failure()
        results['db_exhaustion'] = test_db_exhaustion()
        results['cascading_failure'] = test_cascading_failure()
        results['traffic_anomaly'] = test_traffic_anomaly()
        
        verify_uniqueness(results)
        
        print("\n" + "=" * 70)
        print("🎉 ALL TESTS PASSED - Demo is ready!")
        print("=" * 70)
        print("\nSummary:")
        for name, result in results.items():
            print(f"  • {name}: Confidence {result['confidence']}, {len(result['evidence'])} evidence points, {len(result['recommended_actions'])} actions")
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
