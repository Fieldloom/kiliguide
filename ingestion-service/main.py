import logging
import sys
from fastapi import FastAPI
from contextlib import asynccontextmanager

from .api import router
from .scheduler import init_scheduler
from .database import engine, Base

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# Ensure tables exist (crawled_pages)
# global_documents should already exist via supabase migrations, 
# but Base.metadata.create_all will create crawled_pages if missing
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")
except Exception as e:
    logger.error(f"Failed to verify database tables: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Ingestion Service...")
    init_scheduler()
    yield
    # Shutdown
    logger.info("Shutting down Ingestion Service...")

app = FastAPI(
    title="KiliGuide Ingestion Service",
    description="Automated crawler and vector ingestion service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ingestion-service.main:app", host="0.0.0.0", port=8000, reload=True)
