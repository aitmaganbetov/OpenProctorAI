from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db, engine
from app.models.models import Base
from app.api.routes import api_router

# Создаем таблицы автоматически (для Dev режима, в Проде нужен Alembic)
Base.metadata.create_all(bind=engine)

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
