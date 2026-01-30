import requests
import time
import json

BASE_URL = "http://localhost:5000"

def log(msg):
    print(f"[TEST] {msg}")

def verify_approval_flow():
    log("Starting Phase 5 Verification: Human Approval Agent")

    # 1. Trigger an incident (using previous mechanism directly or mocking)
    # Ideally we'd trigger it via logs, but let's assume one exists or we can trigger reasoning on empty?
    # No, we need an active incident. 
    # Let's verify if there is an active incident. If not, we might need to rely on one being created manually or simulated.
    # Actually, we can use the `mock_incident` approach if we had a debug endpoint, but we don't.
    # We will assume the system is running and we can interact with it.
    
    # Check for active incident
    try:
        resp = requests.get(f"{BASE_URL}/incident/current")
        current = resp.json()
    except Exception as e:
        log(f"Backend not reachable: {e}")
        return

    if not current:
        log("No active incident found. Triggering attack on Attack Backend...")
        try:
            # Trigger Auth Failure (Faster detection)
            requests.post("http://localhost:4000/attack/start/auth-failure", json={})
            log("Attack triggered. Waiting for incident to form...")
            
            # Wait loop
            for i in range(30):
                time.sleep(2)
                
                # Trigger Anomaly Detection explicitly
                try:
                    requests.get(f"{BASE_URL}/anomaly/check")
                except Exception as e:
                    log(f"Failed to check anomaly: {e}")

                resp = requests.get(f"{BASE_URL}/incident/current")
                current = resp.json()
                if current:
                    log("Incident detected!")
                    break
                log("Waiting for incident...")
            
            if not current:
                 log("Timed out waiting for incident. Aborting.")
                 return
        except Exception as e:
            log(f"Failed to trigger attack: {e}")
            return

    incident_id = current["incident_id"]
    log(f"Found active incident: {incident_id}")

    # 2. Verify Initial State
    if current.get("approval", {}).get("status") != "PENDING":
        log(f"FAILURE: Initial approval status is {current.get('approval', {}).get('status')}, expected PENDING")
        return
    log("Confirmed: Default approval status is PENDING.")

    # 3. Attempt Approval WITHOUT Reasoning
    # If the incident is fresh and hasn't been reasoned about.
    # (Assuming we haven't called /reason yet)
    approval_payload = {
        "incident_id": incident_id,
        "decision": "APPROVE",
        "actor": "admin_test",
        "comment": "Premature approval"
    }
    resp = requests.post(f"{BASE_URL}/incident/approve", json=approval_payload)
    if resp.status_code == 400 and "reasoning" in resp.text.lower():
        log("Confirmed: Cannot approve without reasoning (400). GOOD.")
    else:
        log(f"WARNING: Unexpected response for premature approval: {resp.status_code} {resp.text}")

    # 4. Generate Reasoning
    log("Generatng reasoning...")
    resp = requests.post(f"{BASE_URL}/incident/reason")
    if resp.status_code != 200:
        log(f"FAILURE: Reasoning generation failed: {resp.status_code} {resp.text}")
        return
    reasoning = resp.json()
    confidence = reasoning.get("final_confidence", 0)
    log(f"Reasoning generated. Confidence: {confidence}")

    # 5. Attempt Approval (Valid)
    # We might need to ensure confidence is high enough.
    # If confidence < 0.6, we expect failure.
    
    if confidence < 0.6:
        log("Confidence too low. Expecting Rejection/Failure on Approve.")
    
    approval_payload["comment"] = "Valid approval test"
    
    # Try REJECT first if confidence is low, or APPROVE if high?
    # Let's try to APPROVE.
    resp = requests.post(f"{BASE_URL}/incident/approve", json=approval_payload)
    
    if confidence < 0.6:
        if resp.status_code == 400 and "threshold" in resp.text.lower():
            log("Confirmed: Blocked approval due to low confidence. GOOD.")
            
            # Now Verify Rejection works even with low confidence?
            approval_payload["decision"] = "REJECT"
            resp = requests.post(f"{BASE_URL}/incident/approve", json=approval_payload)
            if resp.status_code == 200:
                log("Confirmed: Can REJECT even with low confidence. GOOD.")
            else:
                log(f"FAILURE: Could not reject: {resp.status_code} {resp.text}")
        else:
             log(f"FAILURE: Should have blocked approval but got: {resp.status_code}")
    else:
        # Confidence >= 0.6
        if resp.status_code == 200:
            log("Confirmed: Approval successful. GOOD.")
            data = resp.json()
            if data["approval_status"] == "APPROVED":
                log("State verification PASS.")
                
                # 6. Verify Confidence Snapshot
                log("Verifying confidence snapshot...")
                resp = requests.get(f"{BASE_URL}/incident/current")
                current = resp.json()
                approved_confidence = current.get("approval", {}).get("approved_with_confidence")
                if approved_confidence is not None:
                    if abs(approved_confidence - confidence) < 0.01:
                        log(f"Confirmed: approved_with_confidence = {approved_confidence} matches reasoning final_confidence. GOOD.")
                    else:
                        log(f"WARNING: approved_with_confidence = {approved_confidence} != final_confidence {confidence}")
                else:
                    log("FAILURE: approved_with_confidence field missing!")
                
                # 7. Test Approval Lock (Try to approve again)
                log("Testing approval lock (duplicate approval)...")
                resp = requests.post(f"{BASE_URL}/incident/approve", json=approval_payload)
                if resp.status_code == 409:
                    log("Confirmed: Cannot approve again (409 Conflict). GOOD.")
                else:
                    log(f"FAILURE: Expected 409 but got {resp.status_code}: {resp.text}")
                
                # 8. Try to reject after approval
                log("Testing approval lock (reject after approval)...")
                approval_payload["decision"] = "REJECT"
                resp = requests.post(f"{BASE_URL}/incident/approve", json=approval_payload)
                if resp.status_code == 409:
                    log("Confirmed: Cannot reject after approval (409 Conflict). GOOD.")
                else:
                    log(f"FAILURE: Expected 409 but got {resp.status_code}: {resp.text}")
            else:
                log("State verification FAIL.")
        else:
            log(f"FAILURE: Approval failed unexpectedly: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    try:
        verify_approval_flow()
    except Exception as e:
        log(f"Exception during verification: {e}")
