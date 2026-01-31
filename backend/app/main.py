from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db, engine
from app.models.models import Base
from app.api.routes import api_router
from app.db.database import SessionLocal
from app.models.models import User, UserRole
from sqlalchemy.exc import SQLAlchemyError


# Создаем таблицы автоматически (для Dev режима, в Проде нужен Alembic)
Base.metadata.create_all(bind=engine)

def ensure_student_profile_photo_column() -> None:
    """Ensure MySQL schema contains photo storage columns for student profiles."""
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_profiles'
                      AND COLUMN_NAME = 'photo_base64'
                    """
                )
            )
            has_photo_base64 = bool(result.scalar() or 0)
            if not has_photo_base64:
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN photo_base64 JSON NULL"))

            result = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_profiles'
                      AND COLUMN_NAME = 'photo_path'
                    """
                )
            )
            has_photo_path = bool(result.scalar() or 0)
            if not has_photo_path:
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN photo_path VARCHAR(512) NULL"))
    except SQLAlchemyError:
        # Ignore schema fix errors in dev; database may be read-only or lack privileges.
        pass

ensure_student_profile_photo_column()

app = FastAPI(title="Proctoring System API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Seed a demo teacher user if none exists (dev convenience)
def seed_demo_user():
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
        if not teacher:
            demo = User(email="teacher@university.edu", hashed_password="password123", full_name="Demo Teacher", role=UserRole.TEACHER)
            db.add(demo)
        student = db.query(User).filter(User.role == UserRole.STUDENT).first()
        if not student:
            demo_student = User(email="student@university.edu", hashed_password="password123", full_name="Demo Student", role=UserRole.STUDENT)
            db.add(demo_student)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
    finally:
        db.close()

seed_demo_user()

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Проверяем соединение с БД
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

@app.get("/")
def root():
    return {"message": "University Proctoring System v1.0"}
