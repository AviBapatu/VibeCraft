import sys
import os
import shutil
from datetime import datetime
import time

# Add parent directory to path to import modules
sys.path.append(os.getcwd())

from correlation.incident_manager import IncidentManager, Incident
from memory.vector_store import VectorStore
from memory.embedder import Embedder

TEST_DIR = "memory/test_storage"

def setup():
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)
    os.makedirs(TEST_DIR, exist_ok=True)

def test_persistence():
    print("--- Test Phase 1: Create and Store ---")
    
    # 1. Initialize Manager with test paths
    # We need to hack the init or subclass to override paths, 
    # but IncidentManager is a Singleton.
    # Hack: Creating a standalone VectorStore for test or monkeypatching IncidentManager?
    # Better: Test VectorStore directly first, then Integration.
    
    # Let's test VectorStore directly first as it's the core unit.
    print("Testing VectorStore persistence...")
    embedder = Embedder()
    store = VectorStore(dim=embedder.dim, index_path=f"{TEST_DIR}/index.faiss", meta_path=f"{TEST_DIR}/meta.json")
    
    test_vector = embedder.embed("Database latency high")
    meta = {"id": "123", "summary": "Database latency high"}
    
    store.add(test_vector, meta)
    print("Added vector. Persisted.")
    
    # 2. Reload
    print("--- Test Phase 2: Reload and Verify ---")
    store2 = VectorStore(dim=embedder.dim, index_path=f"{TEST_DIR}/index.faiss", meta_path=f"{TEST_DIR}/meta.json")
    
    if store2.index.ntotal == 1:
        print("SUCCESS: Loaded 1 vector.")
    else:
        print(f"FAILURE: Expected 1 vector, got {store2.index.ntotal}")
        return

    results = store2.search(test_vector, k=1)
    if results and results[0]["id"] == "123":
        print("SUCCESS: Found correct metadata.")
    else:
        print(f"FAILURE: Metadata mismatch. Got {results}")
        return

    # 3. Test Integration with IncidentManager (Mocking paths if possible, else using default)
    # IncidentManager uses hardcoded paths in __init__ currently?
    # No, I changed it to use default args in VectorStore, but IncidentManager calls:
    # self.vector_store = VectorStore(dim=self.embedder.dim) 
    # which uses defaults "memory/storage/index.faiss"
    
    # I should verify that IncidentManager actually calls _store_incident
    print("--- Test Phase 3: IncidentManager Integration ---")
    
    # We will use the REAL paths for this integration test, effectively acting as a system test.
    # Note: This will modify the actual memory.
    
    manager = IncidentManager() # Reset instance if singleton?
    # Singleton check
    IncidentManager._instance = None
    manager = IncidentManager.get_instance()
    
    # Create a dummy incident
    services = {"db-shard-01"}
    signals = {"latency_p99 > 500ms"}
    incident = Incident(services, signals, datetime.now())
    incident.summary_text = "Integration Test Incident"
    incident.resolution = "Fixed by test"
    incident.resolved_at = datetime.now()
    
    # Store it
    print("Storing incident via Manager...")
    manager._store_incident(incident)
    
    # Verify it is in the store
    if manager.vector_store.index.ntotal > 0:
        print(f"SUCCESS: Manager has {manager.vector_store.index.ntotal} vectors.")
    else:
        print("FAILURE: Manager store is empty.")

    # Search check
    q = manager.embedder.embed("Integration Test Incident")
    res = manager.vector_store.search(q)
    print("Search Result:", res)
    found = any(r['summary_text'] == "Integration Test Incident" for r in res)
    if found:
        print("SUCCESS: Found incident via Manager search.")
    else:
        print("FAILURE: Did not find incident.")

if __name__ == "__main__":
    setup()
    try:
        test_persistence()
    finally:
        # Cleanup test dir
        if os.path.exists(TEST_DIR):
            shutil.rmtree(TEST_DIR)
        pass
