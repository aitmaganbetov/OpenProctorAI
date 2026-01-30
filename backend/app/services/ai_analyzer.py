# app/services/ai_analyzer.py
from sqlalchemy.orm import Session
from app.models.models import ExamSession, Violation

class ExamAnalyzer:
    def __init__(self, db: Session, session_id: int):
        self.db = db
        self.session_id = session_id
    
    def analyze(self):
        """Analyze exam session violations and generate final verdict"""
        session = self.db.query(ExamSession).filter(ExamSession.id == self.session_id).first()
        if not session:
            return
        
        violations = self.db.query(Violation).filter(Violation.session_id == self.session_id).all()
        
        total_severity = sum(v.severity_score or 0 for v in violations)
        
        if total_severity == 0:
            session.verdict = "clean"
        elif total_severity <= 5:
            session.verdict = "suspicious"
        else:
            session.verdict = "violation"
        
        session.ai_summary = {
            "total_violations": len(violations),
            "total_severity": total_severity,
            "violation_types": list(set(v.type for v in violations))
        }
        
        self.db.commit()
