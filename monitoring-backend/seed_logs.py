from datetime import datetime, timedelta, timezone
from storage.database import SessionLocal
from models.log import Log
import random
import uuid

def seed_baseline():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    
    # Generate logs for the baseline window (10 mins ago to 1 min ago)
    # Let's generate 5 logs per second for 5 minutes (approx 1500 logs)
    # This gives a healthy baseline.
    
    start_time = now - timedelta(minutes=6)
    end_time = now - timedelta(minutes=2) # Leave a gap so short window is distinct if we run this immediately
    
    current_time = start_time
    logs = []
    
    print(f"Seeding logs from {start_time} to {end_time}")
    
    while current_time < end_time:
        for _ in range(5): # 5 logs per second
            log = Log(
                timestamp=current_time.isoformat(),
                service="seed-service",
                level="INFO",
                message="seeded log",
                request_id=str(uuid.uuid4()),
                ip="127.0.0.1",
                endpoint="/api/test",
                method="GET",
                latency_ms=random.randint(20, 50), # Healthy latency
                status_code=200,
                cpu_pct=10.0,
                memory_mb=100.0,
                retry_count=0
            )
            logs.append(log)
        current_time += timedelta(milliseconds=200) # increment to keep order
        
        if len(logs) >= 1000:
            db.bulk_save_objects(logs)
            db.commit()
            logs = []
            
    if logs:
        db.bulk_save_objects(logs)
        db.commit()
        
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_baseline()
