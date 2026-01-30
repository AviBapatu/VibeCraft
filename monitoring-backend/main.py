from fastapi import FastAPI
from storage.database import engine, Base
from api.ingest import router as ingest_router
from api.anomaly import router as anomaly_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Monitoring Backend")

app.include_router(ingest_router)
app.include_router(anomaly_router)

@app.get("/health")
def health():
    return {"status": "up"}
