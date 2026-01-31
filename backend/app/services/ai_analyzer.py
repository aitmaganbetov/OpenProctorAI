# app/services/ai_analyzer.py
"""AI-powered exam session analysis service."""
from collections import Counter
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import ExamSession, Violation


# Verdict thresholds (configurable per exam in future)
SUSPICIOUS_THRESHOLD = 5
VIOLATION_THRESHOLD = 10


@dataclass
class AnalysisResult:
    """Result of exam session analysis."""
    verdict: str
    total_violations: int
    total_severity: int
    violation_types: list[str]
    type_counts: dict[str, int]


class ExamAnalyzer:
    """Analyze exam sessions for violations and generate verdicts."""

    def __init__(self, db: Session, session_id: int):
        self.db = db
        self.session_id = session_id

    def analyze(self) -> Optional[AnalysisResult]:
        """Analyze exam session violations and generate final verdict.
        
        Returns:
            AnalysisResult if session found, None otherwise.
        """
        session = (
            self.db.query(ExamSession)
            .filter(ExamSession.id == self.session_id)
            .first()
        )
        if not session:
            return None

        violations = (
            self.db.query(Violation)
            .filter(Violation.session_id == self.session_id)
            .all()
        )

        # Calculate metrics
        total_severity = sum(v.severity_score or 0 for v in violations)
        violation_types = [v.type for v in violations]
        type_counts = dict(Counter(violation_types))

        # Determine verdict based on severity
        if total_severity == 0:
            verdict = "clean"
        elif total_severity <= SUSPICIOUS_THRESHOLD:
            verdict = "suspicious"
        elif total_severity <= VIOLATION_THRESHOLD:
            verdict = "warning"
        else:
            verdict = "violation"

        # Update session
        session.verdict = verdict
        session.ai_summary = {
            "total_violations": len(violations),
            "total_severity": total_severity,
            "violation_types": list(set(violation_types)),
            "type_counts": type_counts,
            "analysis_version": "1.0",
        }

        self.db.commit()

        return AnalysisResult(
            verdict=verdict,
            total_violations=len(violations),
            total_severity=total_severity,
            violation_types=list(set(violation_types)),
            type_counts=type_counts,
        )
