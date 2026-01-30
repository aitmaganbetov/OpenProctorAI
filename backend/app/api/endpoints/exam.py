# app/api/endpoints/exam.py
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ExamSession
from datetime import datetime
from app.services.ai_analyzer import ExamAnalyzer

router = APIRouter(prefix="/exams", tags=["exams"])

@router.post("/sessions/{session_id}/finish")
def finish_exam_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}
    
    session.end_time = datetime.now()
    session.verdict = "processing"
    db.commit()
    
    background_tasks.add_task(run_analysis_task, db, session_id)
    return {"status": "exam_finished", "message": "Results are being processed"}

def run_analysis_task(db: Session, session_id: int):
    try:
        analyzer = ExamAnalyzer(db, session_id)
        analyzer.analyze()
    except Exception as e:
        print(f"Analysis error: {e}")
