# app/api/endpoints/exam.py
from fastapi import APIRouter, Depends, BackgroundTasks, Body, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ExamSession, Exam, User, UserRole
from datetime import datetime
from app.services.ai_analyzer import ExamAnalyzer
from typing import List, Dict, Any
from app.models.models import ExamAssignment

router = APIRouter(prefix="/exams", tags=["exams"])

@router.get("/user/{email}")
def get_user_by_email(email: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get user info by email to retrieve numeric user ID."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role
    }

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

@router.post("/sessions")
def start_exam_session(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new exam session for a student to take an exam."""
    exam_id = payload.get("exam_id")
    student_id = payload.get("student_id") or 1  # Default to first user for demo
    
    if not exam_id:
        return {"error": "exam_id is required"}
    
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return {"error": "Exam not found"}
    
    session = ExamSession(
        exam_id=exam_id,
        student_id=student_id,
        start_time=datetime.now(),
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "exam_id": session.exam_id,
        "student_id": session.student_id,
        "started_at": session.start_time.isoformat(),
        "status": session.status
    }

def run_analysis_task(db: Session, session_id: int):
    try:
        analyzer = ExamAnalyzer(db, session_id)
        analyzer.analyze()
    except Exception as e:
        print(f"Analysis error: {e}")


# Simple exams listing and creation endpoints so frontend can operate.
@router.get("")
def list_exams(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    exams = db.query(Exam).all()
    results: List[Dict[str, Any]] = []
    for e in exams:
        cfg = e.config or {}
        results.append({
            "id": e.id,
            "title": e.title,
            "description": cfg.get("description", "") or "",
            "duration_minutes": e.duration_minutes or 60,
            "created_by": getattr(e, "created_by_id", None),
            "created_at": getattr(e, "created_at", datetime.now()).isoformat() if hasattr(e, 'created_at') else datetime.now().isoformat(),
            "questions": cfg.get("questions", []) or [],
        })
    return results


@router.post("")
def create_exam(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    title = payload.get("title") or payload.get("name") or "Untitled Exam"
    duration = payload.get("duration_minutes") or payload.get("duration") or 60

    exam = Exam(title=title, duration_minutes=int(duration))
    # If a seeded teacher user (id=1) exists, associate it; otherwise leave NULL
    try:
        # Prefer an existing teacher user, otherwise any user
        teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
        if teacher:
            exam.created_by_id = teacher.id
        else:
            any_user = db.query(User).first()
            if any_user:
                exam.created_by_id = any_user.id
    except Exception:
        # leave created_by_id unset if any DB check fails
        pass
    # Persist description and questions inside the JSON config column
    try:
        base_cfg = exam.config or {}
    except Exception:
        base_cfg = {}

    base_cfg.update({
        "description": payload.get("description", ""),
        "questions": payload.get("questions", []),
    })

    exam.config = base_cfg

    db.add(exam)
    db.commit()
    db.refresh(exam)

    return {
        "id": exam.id,
        "title": exam.title,
        "description": base_cfg.get("description", ""),
        "duration_minutes": exam.duration_minutes,
        "created_by": getattr(exam, "created_by_id", None),
        "created_at": datetime.now().isoformat(),
        "questions": base_cfg.get("questions", []),
    }


@router.put("/{exam_id}")
def update_exam(exam_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return {"error": "Exam not found"}

    title = payload.get("title")
    duration = payload.get("duration_minutes")
    try:
        if title:
            exam.title = title
        if duration:
            exam.duration_minutes = int(duration)

        # update config fields (description/questions)
        cfg = exam.config or {}
        if "description" in payload:
            cfg["description"] = payload.get("description", "")
        if "questions" in payload:
            cfg["questions"] = payload.get("questions", [])

        exam.config = cfg
        db.add(exam)
        db.commit()
        db.refresh(exam)

        return {
            "id": exam.id,
            "title": exam.title,
            "description": cfg.get("description", ""),
            "duration_minutes": exam.duration_minutes,
            "created_by": getattr(exam, "created_by_id", None),
            "created_at": datetime.now().isoformat(),
            "questions": cfg.get("questions", []),
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}


@router.post("/{exam_id}/assign")
def assign_exam(exam_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Assign an exam to a student. Accepts `student_id` or `student_email` in payload."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return {"error": "Exam not found"}

    student = None
    if payload.get("student_id"):
        student = db.query(User).filter(User.id == int(payload.get("student_id"))).first()
    elif payload.get("student_email"):
        student = db.query(User).filter(User.email == payload.get("student_email")).first()

    if not student:
        return {"error": "Student not found"}

    # create assignment
    from app.models.models import ExamAssignment

    assignment = ExamAssignment(exam_id=exam.id, student_id=student.id)
    due = payload.get("due_date")
    if due:
        try:
            # expect ISO timestamp
            assignment.due_date = datetime.fromisoformat(due)
        except Exception:
            pass

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "id": assignment.id,
        "exam_id": assignment.exam_id,
        "student_id": assignment.student_id,
        "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else datetime.now().isoformat(),
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        "status": assignment.status,
    }


@router.get("/assignments")
def list_assignments(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    assignments = db.query(ExamAssignment).all()
    out: List[Dict[str, Any]] = []
    for a in assignments:
        student = db.query(User).filter(User.id == a.student_id).first()
        exam = db.query(Exam).filter(Exam.id == a.exam_id).first()
        out.append({
            "id": a.id,
            "exam_id": a.exam_id,
            "exam_title": getattr(exam, 'title', None),
            "student_id": a.student_id,
            "student_email": getattr(student, 'email', None),
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "status": a.status,
        })
    return out


@router.get("/{exam_id}/assignments")
def list_assignments_for_exam(exam_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    assignments = db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id).all()
    out: List[Dict[str, Any]] = []
    for a in assignments:
        student = db.query(User).filter(User.id == a.student_id).first()
        out.append({
            "id": a.id,
            "exam_id": a.exam_id,
            "student_id": a.student_id,
            "student_email": getattr(student, 'email', None),
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "status": a.status,
        })
    return out


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    assignment = db.query(ExamAssignment).filter(ExamAssignment.id == assignment_id).first()
    if not assignment:
        return {"error": "Assignment not found"}
    try:
        db.delete(assignment)
        db.commit()
        return {"status": "deleted", "id": assignment_id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
