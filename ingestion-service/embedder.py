import httpx
from typing import List
from .config import settings
import logging

logger = logging.getLogger(__name__)

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings using NVIDIA Embeddings API.
    Fallback to a local dummy embedding if API key is not set, just for testing.
    """
    if not settings.NVIDIA_API_KEY:
        logger.warning("NVIDIA_API_KEY not set. Using zeroed embeddings for testing.")
        return [[0.0] * 768 for _ in texts]
        
    url = "https://integrate.api.nvidia.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # We use NV-Embed-QA as an example model
    payload = {
        "input": texts,
        "model": "nvidia/nv-embedqa-e5-v5",
        "input_type": "passage"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            embeddings = [item['embedding'] for item in data['data']]
            return embeddings
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        # Return zeros to prevent crashing the whole pipeline on API failure
        return [[0.0] * 768 for _ in texts]
