import trafilatura
import fitz  # PyMuPDF
from typing import Tuple, Optional
import httpx
import logging

logger = logging.getLogger(__name__)

async def extract_content(url: str, html_content: bytes) -> Tuple[Optional[str], str]:
    """
    Extracts meaningful content from either HTML or PDF bytes.
    Returns (cleaned_text, document_type).
    """
    if url.lower().endswith(".pdf"):
        return await extract_pdf_content(html_content), "pdf"
    
    # Use trafilatura for highly accurate main-content extraction (strips nav, footer, ads)
    extracted = trafilatura.extract(html_content, include_links=False, include_images=False, include_tables=True)
    if extracted:
        return extracted, "html"
        
    return None, "unknown"

async def extract_pdf_content(pdf_bytes: bytes) -> Optional[str]:
    """
    Extract text from PDF using PyMuPDF.
    If the document appears to be scanned, fallback to NVIDIA Vision OCR.
    """
    try:
        doc = fitz.open("pdf", pdf_bytes)
        text_parts = []
        is_scanned = True
        
        # Check if we can extract native text
        for page in doc:
            page_text = page.get_text().strip()
            text_parts.append(page_text)
            if len(page_text) > 100:
                is_scanned = False
                
        # If it seems to be scanned (or very little text), use OCR
        if is_scanned:
            from .config import settings
            if not settings.NVIDIA_API_KEY:
                logger.warning("PDF appears to be scanned but NVIDIA_API_KEY is not set. Returning empty.")
                return ""
                
            logger.info("PDF appears to be scanned. Falling back to NVIDIA Llama 3.2 Vision OCR...")
            ocr_text_parts = []
            
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                for page in doc:
                    pix = page.get_pixmap(dpi=150)
                    img_data = pix.tobytes("jpeg")
                    import base64
                    b64_img = base64.b64encode(img_data).decode("utf-8")
                    
                    payload = {
                        "model": "meta/llama-3.2-11b-vision-instruct",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Extract all readable text from this page. Output ONLY the extracted text, no conversational preamble."},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                                ]
                            }
                        ],
                        "max_tokens": 1024,
                        "temperature": 0.0,
                        "stream": False
                    }
                    
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    ocr_text_parts.append(data["choices"][0]["message"]["content"])
                    
            return "\n\n".join(ocr_text_parts).strip()

        return "\n\n".join(text_parts).strip()
    except Exception as e:
        logger.error(f"Failed to extract PDF content: {e}")
        return None
