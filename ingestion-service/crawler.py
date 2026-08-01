import asyncio
import httpx
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from sqlalchemy import delete
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

from .models import CrawledPage, GlobalDocument
from .database import SessionLocal
from .extractor import extract_content
from .chunker import generate_hash, chunk_text_by_headings
from .embedder import generate_embeddings

logger = logging.getLogger(__name__)

def extract_pdf_links(base_url: str, html: bytes) -> list[str]:
    links = []
    try:
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.lower().endswith(".pdf"):
                full_url = urljoin(base_url, href)
                if "dkut.ac.ke" in full_url:  # Ensure we stay on domain
                    links.append(full_url)
    except Exception as e:
        logger.error(f"Error parsing PDF links from {base_url}: {e}")
    return list(set(links))

async def fetch_with_playwright(url: str) -> bytes:
    logger.info(f"Falling back to Playwright for dynamic rendering: {url}")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            content = await page.content()
            await browser.close()
            return content.encode("utf-8")
    except Exception as e:
        logger.error(f"Playwright fallback failed for {url}: {e}")
        return b""

async def crawl_page(url: str, lastmod: str, db: Session) -> tuple[str, list[str]]:
    """
    Crawls a single page.
    Returns: (status, discovered_links)
    """
    logger.info(f"Crawling URL: {url}")
    discovered_links = []
    
    # 1. Fetch content
    raw_content = b""
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            raw_content = response.content
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        _update_page_status(db, url, "error", None, lastmod)
        return "error", []
        
    if not url.lower().endswith(".pdf"):
        discovered_links.extend(extract_pdf_links(url, raw_content))
        
    # 2. Extract meaningful text
    text, doc_type = await extract_content(url, raw_content)
    
    # SPA Fallback logic
    if doc_type != "pdf" and (not text or len(text.strip()) < 50):
        raw_content = await fetch_with_playwright(url)
        if raw_content:
            discovered_links.extend(extract_pdf_links(url, raw_content))
            text, doc_type = await extract_content(url, raw_content)
            
    discovered_links = list(set(discovered_links))
    
    if not text or not text.strip():
        logger.warning(f"No meaningful content extracted from {url}")
        _update_page_status(db, url, "skipped_no_content", None, lastmod)
        return "skipped_no_content", discovered_links
        
    # 3. Hash checking
    content_hash = generate_hash(text)
    
    existing = db.query(CrawledPage).filter(CrawledPage.url == url).first()
    if existing and existing.content_hash == content_hash and existing.status == "embedded":
        logger.debug(f"Content hash unchanged for {url}. Skipping embedding.")
        _update_page_status(db, url, "embedded", content_hash, lastmod)
        return "skipped_unchanged", discovered_links
        
    # 4. Chunking
    chunks = chunk_text_by_headings(text)
    if not chunks:
        _update_page_status(db, url, "skipped_no_content", content_hash, lastmod)
        return "skipped_no_content", discovered_links
        
    # 5. Embeddings
    embeddings = await generate_embeddings(chunks)
    
    # 6. Database Insertion
    try:
        db.execute(delete(GlobalDocument).where(GlobalDocument.metadata['url'].astext == url))
        
        docs_to_insert = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            metadata = {
                "url": url,
                "title": f"Page Chunk {i+1}",
                "department": "University Data",
                "document_type": doc_type,
                "source": "automated_crawler",
                "chunk_number": i,
                "lastmod": lastmod
            }
            doc = GlobalDocument(
                content=chunk,
                embedding=embedding,
                metadata=metadata
            )
            docs_to_insert.append(doc)
            
        db.add_all(docs_to_insert)
        _update_page_status(db, url, "embedded", content_hash, lastmod)
        db.commit()
        return "embedded", discovered_links
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during insertion for {url}: {e}")
        _update_page_status(db, url, "error", None, lastmod)
        return "error", discovered_links


def _update_page_status(db: Session, url: str, status: str, content_hash: str = None, lastmod: str = None):
    """Helper to update the crawled_pages tracker."""
    try:
        page = db.query(CrawledPage).filter(CrawledPage.url == url).first()
        
        parsed_lastmod = None
        if lastmod:
            try:
                # Basic ISO parsing. Note: fromisoformat handles standard ISO 8601
                parsed_lastmod = datetime.fromisoformat(lastmod.replace('Z', '+00:00'))
            except ValueError:
                pass

        if not page:
            page = CrawledPage(url=url)
            db.add(page)
            
        page.status = status
        page.last_crawled = datetime.now(timezone.utc)
        if content_hash:
            page.content_hash = content_hash
        if parsed_lastmod:
            page.lastmod = parsed_lastmod
            
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update page status for {url}: {e}")
