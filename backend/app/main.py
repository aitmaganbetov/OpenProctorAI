from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db, engine, SessionLocal
from app.models.models import Base, User, UserRole
from app.api.routes import api_router


def _ensure_student_profile_photo_column() -> None:
    """Ensure MySQL schema contains photo storage columns for student profiles."""
    try:
        with engine.begin() as conn:
            # Check for photo_base64 column
            result = conn.execute(
                text(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_profiles'
                      AND COLUMN_NAME = 'photo_base64'
                    """
                )
            )
            if not result.scalar():
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN photo_base64 JSON NULL"))

            # Check for photo_path column
            result = conn.execute(
                text(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_profiles'
                      AND COLUMN_NAME = 'photo_path'
                    """
                )
            )
            if not result.scalar():
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN photo_path VARCHAR(512) NULL"))
    except SQLAlchemyError:
        # Ignore schema fix errors; database may be read-only
        pass


def _seed_demo_users() -> None:
    """Seed demo users for development if none exist."""
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == UserRole.TEACHER).first():
            db.add(User(
                email="teacher@university.edu",
                hashed_password="password123",
                full_name="Demo Teacher",
                role=UserRole.TEACHER,
            ))
        if not db.query(User).filter(User.role == UserRole.STUDENT).first():
            db.add(User(
                email="student@university.edu",
                hashed_password="password123",
                full_name="Demo Student",
                role=UserRole.STUDENT,
            ))
        db.commit()
    except SQLAlchemyError:
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    Base.metadata.create_all(bind=engine)
    _ensure_student_profile_photo_column()
    _seed_demo_users()
    yield
    # Shutdown: cleanup resources if needed
    engine.dispose()


app = FastAPI(
    title="Proctoring System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for load balancers and monitoring."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError as e:
        return {"status": "error", "database": str(e)}


@app.get("/", tags=["root"])
def root():
    """Root endpoint with API info."""
    return {"message": "University Proctoring System v1.0"}
