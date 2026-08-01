from fastapi import APIRouter, BackgroundTasks
from .scheduler import job_state, run_ingestion_pipeline, scheduler
from .config import settings

router = APIRouter(prefix="/scheduler", tags=["scheduler"])

@router.get("/status")
async def get_status():
    return {
        "is_running": job_state["is_running"],
        "interval_minutes": settings.INGESTION_INTERVAL_MINUTES,
        "scheduler_active": scheduler.running
    }

@router.post("/run")
async def trigger_run(background_tasks: BackgroundTasks):
    if job_state["is_running"]:
        return {"status": "already_running"}
    
    background_tasks.add_task(run_ingestion_pipeline)
    return {"status": "triggered"}

@router.post("/stop")
async def stop_scheduler():
    if scheduler.running:
        scheduler.pause()
        return {"status": "paused"}
    return {"status": "already_paused"}

@router.post("/start")
async def start_scheduler():
    if not scheduler.running:
        scheduler.resume()
        return {"status": "resumed"}
    return {"status": "already_running"}

@router.get("/statistics")
async def get_statistics():
    return {
        "last_run": job_state["last_run"],
        "total_urls": job_state["total_urls"],
        "embedded": job_state["embedded"],
        "skipped": job_state["skipped"],
        "errors": job_state["errors"],
        "deleted": job_state.get("deleted", 0)
    }
