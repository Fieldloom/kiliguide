from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# For async operations we'd use create_async_engine and AsyncSession,
# but using standard engine since SQLAlchemy async can be complex with pgvector.
# We'll stick to standard SQLAlchemy for simplicity in worker threads unless asyncpg is strictly required.

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
