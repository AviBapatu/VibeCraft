from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
import httpx
from fastapi.middleware.cors import CORSMiddleware
from storage.database import engine, Base
from api.ingest import router as ingest_router
from api.anomaly import router as anomaly_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Monitoring Backend")

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(anomaly_router)
from api.incident import router as incident_router
app.include_router(incident_router)

from api.debug import router as debug_router, pipeline_router
app.include_router(debug_router)
app.include_router(pipeline_router)

from api.demo import router as demo_router
app.include_router(demo_router)

@app.get("/attack/status")
async def proxy_attack_status():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("http://localhost:4000/attack/status")
            return resp.json()
        except:
            return {"status": "unknown", "error": "Attack backend unreachable"}


@app.get("/health")
def health():
    return {"status": "up"}


import asyncio
from datetime import datetime, timezone
from storage.database import SessionLocal
from detection.anomaly_detector import detect_anomaly
from correlation.incident_manager import IncidentManager

@app.on_event("startup")
async def schedule_periodic_detection():
    loop = asyncio.get_event_loop()
    loop.create_task(run_detection_loop())

async def run_detection_loop():
    print("Starting background anomaly detection loop...")
    while True:
        try:
            # Run detection every 5 seconds
            await asyncio.sleep(5)
            
            db = SessionLocal()
            try:
                # 1. Detect
                result = detect_anomaly(db)
                
                # 2. Update Incident State
                manager = IncidentManager.get_instance()
                manager.update(
                    anomaly_result=result,
                    affected_services=result.get("affected_services", []),
                    now=datetime.now(timezone.utc)
                )
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in detection loop: {e}")
            # Don't crash the loop
            await asyncio.sleep(5)
