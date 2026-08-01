from sqlalchemy import Column, String, DateTime, func
from pgvector.sqlalchemy import Vector
from .database import Base
from sqlalchemy.dialects.postgresql import JSONB

class CrawledPage(Base):
    __tablename__ = "crawled_pages"
    
    url = Column(String, primary_key=True, index=True)
    lastmod = Column(DateTime(timezone=True), nullable=True)
    content_hash = Column(String, nullable=True)
    last_crawled = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String, nullable=False, index=True)

class GlobalDocument(Base):
    """
    Mapping for the existing global_documents table which uses pgvector.
    We assume id is UUID, content is TEXT, embedding is VECTOR(768), metadata is JSONB.
    """
    __tablename__ = "global_documents"
    
    # Using String for UUID since Supabase typically generates it via gen_random_uuid()
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    content = Column(String, nullable=False)
    embedding = Column(Vector(768))
    metadata = Column(JSONB, nullable=True)
