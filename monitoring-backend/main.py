from fastapi import FastAPI
from storage.database import engine, Base
from api.ingest import router as ingest_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Monitoring Backend")

app.include_router(ingest_router)

@app.get("/health")
def health():
    return {"status": "up"}
