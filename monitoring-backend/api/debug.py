from fastapi import APIRouter
from debug.pipeline_state import PIPELINE_STATE

router = APIRouter(prefix="/debug")

@router.get("/pipeline")
def get_pipeline_state():
    return PIPELINE_STATE
