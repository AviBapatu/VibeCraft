import sys
import os
from datetime import datetime, timedelta
import time

# Ensure we can import from local modules
sys.path.append(os.getcwd())

from correlation.incident_manager import IncidentManager

def verify_memory_flow():
    print("Initializing IncidentManager...")
    manager = IncidentManager.get_instance()
    
    # Clear any existing state for clean test - re-init vector store if possible or just use what we have
    # Since we use a singleton, we might have previous state if the process was running, but here we start fresh script.
    # However, VectorStore might load from disk if I implemented persistence. I didn't verify persistence implementation details fully (initially "pass" in _persist).
    # So it should be empty in memory.
    
    # 1. Create First Incident (The "Memory")
    print("\n--- Step 1: Create and Resolve First Incident ---")
    now = datetime.now()
    services = {"auth-service", "user-db"}
    signals = {"high_latency", "error_rate_spike"}
    
    # Simulate anomaly update to create incident
    manager.update({
        "anomaly": True,
        "signals": list(signals)
    }, list(services), now)
    
    incident_1 = manager.get_current()
    if not incident_1:
        print("FAILED: Incident 1 not created")
        return
    print(f"Incident 1 Created: {incident_1['incident_id']}")
    
    # Resolve it
    print("Simulating resolution...")
    # Force resolve by mocking time or using update logic? 
    # Use update logic with NO anomaly and time skip
    future = now + timedelta(seconds=301) # > 300s timeout
    manager.update({
        "anomaly": False,
        "signals": []
    }, [], future)
    
    # Check if resolved
    incident_1_resolved = manager.active_incident
    if incident_1_resolved.status != "RESOLVED":
        # It might not have resolved if I messed up the timeout logic.
        # Logic: if active_incident and not resolved -> check timeout.
        # My update call passed future time.
        print(f"FAILED: Incident 1 status is {incident_1_resolved.status}, expected RESOLVED")
        return
        
    print(f"Incident 1 Resolved. Verifying vector store...")
    if manager.vector_store.index.ntotal == 0:
        print("FAILED: Vector store is empty after resolution")
        return
    print(f"Vector Store Count: {manager.vector_store.index.ntotal}")

    # 2. Create Second Incident (The "Query")
    print("\n--- Step 2: Create Second Similar Incident ---")
    # We need to clear active incident to force new creation? 
    # Logic: "if active_incident.status == RESOLVED -> create new incident"
    # So just sending a new anomaly should trigger creation.
    
    now_2 = future + timedelta(seconds=10)
    # Similar signals
    services_2 = {"auth-service"}
    signals_2 = {"high_latency"}
    
    manager.update({
        "anomaly": True,
        "signals": list(signals_2)
    }, list(services_2), now_2)
    
    incident_2 = manager.get_current()
    if incident_2['incident_id'] == incident_1['incident_id']:
        print("FAILED: Did not create new incident (ID matches old one)")
        return
        
    print(f"Incident 2 Created: {incident_2['incident_id']}")
    
    # Check similar incidents
    similars = incident_2.get("similar_incidents", [])
    print(f"Found {len(similars)} similar incidents.")
    
    if len(similars) == 0:
        print("FAILED: No similar incidents found (expected Incident 1)")
        # Print debug info
        print(f"Incident 1 ID: {incident_1['incident_id']}")
        return
        
    first_match = similars[0]
    print(f"Top match ID: {first_match['incident_id']}")
    print(f"Top match summary: {first_match.get('summary_text')}")
    
    if first_match['incident_id'] == incident_1['incident_id']:
        print("\nSUCCESS: Memory flow verified!")
    else:
        print("\nFAILED: Top match does not match Incident 1")

if __name__ == "__main__":
    verify_memory_flow()
