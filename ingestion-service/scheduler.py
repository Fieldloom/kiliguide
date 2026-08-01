import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from sqlalchemy import delete

from .config import settings
from .database import SessionLocal
from .models import CrawledPage, GlobalDocument
from .sitemap import fetch_sitemap_urls
from .crawler import crawl_page

logger = logging.getLogger(__name__)

# Global state for API visibility
job_state = {
    "is_running": False,
    "last_run": None,
    "total_urls": 0,
    "embedded": 0,
    "skipped": 0,
    "errors": 0,
    "deleted": 0,
    "start_time": None,
    "end_time": None
}

scheduler = AsyncIOScheduler()

async def run_ingestion_pipeline():
    """Main pipeline execution logic with spidering and cleanup."""
    if job_state["is_running"]:
        logger.warning("Ingestion pipeline is already running. Skipping trigger.")
        return
        
    job_state["is_running"] = True
    job_state["start_time"] = datetime.now()
    job_state["total_urls"] = 0
    job_state["embedded"] = 0
    job_state["skipped"] = 0
    job_state["errors"] = 0
    job_state["deleted"] = 0
    
    logger.info("Starting scheduled ingestion pipeline...")
    
    try:
        urls_data = await fetch_sitemap_urls(settings.SITEMAP_URL)
        seen_urls = set()
        queue = asyncio.Queue()
        
        for u in urls_data:
            await queue.put(u)
            
        async def worker():
            while True:
                try:
                    url_info = await queue.get()
                except asyncio.CancelledError:
                    break
                    
                url = url_info["url"]
                
                if url in seen_urls:
                    queue.task_done()
                    continue
                    
                seen_urls.add(url)
                job_state["total_urls"] = len(seen_urls)
                
                db = SessionLocal()
                try:
                    status, discovered = await crawl_page(url, url_info.get("lastmod"), db)
                    
                    if status == "embedded":
                        job_state["embedded"] += 1
                    elif status.startswith("skipped"):
                        job_state["skipped"] += 1
                    else:
                        job_state["errors"] += 1
                        
                    # Queue discovered links (Deep Web Spidering)
                    for new_url in discovered:
                        if new_url not in seen_urls:
                            await queue.put({"url": new_url, "lastmod": None})
                            
                except Exception as e:
                    logger.error(f"Worker error on {url}: {e}")
                    job_state["errors"] += 1
                finally:
                    db.close()
                    queue.task_done()
                    
        # Start 5 concurrent workers
        workers = [asyncio.create_task(worker()) for _ in range(5)]
        
        # Wait until the queue is completely empty (all sitemap and discovered URLs processed)
        await queue.join()
        
        # Cancel workers
        for w in workers:
            w.cancel()
            
        # --- GHOST VECTOR CLEANUP ---
        logger.info("Starting Ghost Vector cleanup...")
        db = SessionLocal()
        try:
            all_pages = db.query(CrawledPage).all()
            deleted_count = 0
            for page in all_pages:
                if page.url not in seen_urls:
                    logger.info(f"Deleting stale data for vanished URL: {page.url}")
                    db.execute(delete(GlobalDocument).where(GlobalDocument.metadata['url'].astext == page.url))
                    db.delete(page)
                    deleted_count += 1
            db.commit()
            job_state["deleted"] = deleted_count
            logger.info(f"Cleanup complete. Deleted {deleted_count} ghost vectors.")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Critical error in ingestion pipeline: {e}")
    finally:
        job_state["is_running"] = False
        job_state["end_time"] = datetime.now()
        job_state["last_run"] = job_state["end_time"]
        
        duration = (job_state["end_time"] - job_state["start_time"]).total_seconds()
        logger.info(
            f"Pipeline completed in {duration:.2f} seconds. "
            f"Processed {job_state['total_urls']} URLs. "
            f"{job_state['embedded']} embedded, {job_state['skipped']} skipped, {job_state['errors']} errors, {job_state['deleted']} deleted."
        )

def init_scheduler():
    scheduler.add_job(
        run_ingestion_pipeline, 
        'interval', 
        minutes=settings.INGESTION_INTERVAL_MINUTES,
        id='ingestion_job',
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"Scheduler started. Interval: {settings.INGESTION_INTERVAL_MINUTES} minutes.")
