from fastapi import FastAPI
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

@app.get("/health")
def health():
    return {"status": "up"}
