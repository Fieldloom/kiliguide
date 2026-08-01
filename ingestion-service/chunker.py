import hashlib
import re
from typing import List, Dict

def generate_hash(text: str) -> str:
    """Generate SHA256 hash of cleaned text to detect changes."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def chunk_text_by_headings(text: str) -> List[str]:
    """
    Splits text primarily by markdown-style headings or double newlines 
    to preserve semantic boundaries.
    """
    # Simple semantic chunker: split on double newlines to separate paragraphs/sections
    paragraphs = re.split(r'\n\s*\n', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    max_chunk_length = 1500  # Target character length per chunk
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
            
        if current_length + len(p) > max_chunk_length and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p]
            current_length = len(p)
        else:
            current_chunk.append(p)
            current_length += len(p)
            
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks
