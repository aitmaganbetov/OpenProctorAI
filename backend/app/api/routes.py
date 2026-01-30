# app/api/routes.py
from fastapi import APIRouter
from app.api.endpoints import exam, proctoring

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(exam.router)
api_router.include_router(proctoring.router)
