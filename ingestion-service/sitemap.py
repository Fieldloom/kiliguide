import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def fetch_sitemap_urls(sitemap_url: str) -> List[Dict[str, Optional[str]]]:
    """
    Fetches the sitemap and parses all URLs and their lastmod dates.
    Returns a list of dicts: [{'url': str, 'lastmod': str}]
    """
    logger.info(f"Fetching sitemap from {sitemap_url}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(sitemap_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'xml')
            urls = []
            
            # The sitemap could be an index or a direct urlset. Let's assume standard urlset for now.
            for url_node in soup.find_all('url'):
                loc_node = url_node.find('loc')
                lastmod_node = url_node.find('lastmod')
                
                if loc_node:
                    urls.append({
                        "url": loc_node.text.strip(),
                        "lastmod": lastmod_node.text.strip() if lastmod_node else None
                    })
            
            logger.info(f"Successfully extracted {len(urls)} URLs from sitemap.")
            return urls
    except Exception as e:
        logger.error(f"Failed to fetch or parse sitemap: {e}")
        return []
