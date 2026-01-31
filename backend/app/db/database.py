from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Optimized connection pool settings for production
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Check connection health before use
    pool_size=10,        # Maintain 10 connections in pool
    max_overflow=20,     # Allow up to 20 additional connections
    pool_timeout=30,     # Timeout waiting for connection
    pool_recycle=1800,   # Recycle connections after 30 minutes
    echo=False,          # Disable SQL logging in production
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Prevent lazy loading issues after commit
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database sessions.
    
    Yields a database session and ensures proper cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions outside FastAPI routes.
    
    Usage:
        with get_db_context() as db:
            db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
