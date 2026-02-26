from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.tracking import LearningSession, QuizAttempt, UserActivityLog, PerformanceAnalysis
from app.models.course import Enrollment, Course
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.auth.dependencies import get_current_user
from app.services.performance_service import update_user_performance

router = APIRouter()

class StartCourseReq(BaseModel):
    course_id: uuid.UUID

class LessonProgressReq(BaseModel):
    course_id: uuid.UUID
    lesson_id: uuid.UUID
    percent: int

class QuizSubmitReq(BaseModel):
    course_id: uuid.UUID
    quiz_id: uuid.UUID
    score: int
    total_questions: int
    time_taken_seconds: int

class SessionEndReq(BaseModel):
    course_id: uuid.UUID
    lesson_id: Optional[uuid.UUID] = None
    started_at: datetime
    ended_at: datetime

@router.post("/course/start")
def start_course(req: StartCourseReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Log Activity
    log = UserActivityLog(
        user_id=current_user.id,
        activity_type="course_start",
        metadata_json={"detail": f"Started course {req.course_id}", "course_id": str(req.course_id)}
    )
    db.add(log)
    db.commit()
    return {"success": True}

@router.post("/lesson/progress")
def update_lesson_progress(req: LessonProgressReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(LessonProgress).filter(
        LessonProgress.learner_id == current_user.id,
        LessonProgress.lesson_id == req.lesson_id
    ).first()
    
    if not progress:
        progress = LessonProgress(
            learner_id=current_user.id,
            lesson_id=req.lesson_id,
            progress_percent=req.percent
        )
        db.add(progress)
    else:
        progress.progress_percent = req.percent
        
    # Log Activity
    log = UserActivityLog(
        user_id=current_user.id,
        activity_type="lesson_progress",
        metadata_json={
            "detail": f"Updated progress on lesson {req.lesson_id} to {req.percent}%",
            "course_id": str(req.course_id),
            "lesson_id": str(req.lesson_id)
        }
    )
    db.add(log)
    db.commit()
    
    # Recalculate performance async or synchronously
    update_user_performance(current_user.id, db)
    
    return {"success": True, "percent": req.percent}

@router.post("/quiz/submit")
def submit_quiz(req: QuizSubmitReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_attempts_count = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.quiz_id == req.quiz_id
    ).count()

    attempt = QuizAttempt(
        user_id=current_user.id,
        course_id=req.course_id,
        quiz_id=req.quiz_id,
        score=req.score,
        total_questions=req.total_questions,
        time_taken_seconds=req.time_taken_seconds,
        attempt_number=current_attempts_count + 1
    )
    db.add(attempt)
    
    # Log Activity
    log = UserActivityLog(
        user_id=current_user.id,
        activity_type="quiz_submitted",
        metadata_json={
            "detail": f"Submitted quiz {req.quiz_id} inside course {req.course_id} with score {req.score}/{req.total_questions}",
            "course_id": str(req.course_id),
            "quiz_id": str(req.quiz_id),
            "score": req.score
        }
    )
    db.add(log)
    db.commit()
    
    update_user_performance(current_user.id, db)
    return {"success": True, "score": req.score}

@router.post("/session/end")
def end_session(req: SessionEndReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    duration = (req.ended_at - req.started_at).total_seconds()
    
    session = LearningSession(
        user_id=current_user.id,
        course_id=req.course_id,
        lesson_id=req.lesson_id,
        started_at=req.started_at,
        ended_at=req.ended_at,
        duration_seconds=int(duration)
    )
    db.add(session)
    
    # Log Activity
    log = UserActivityLog(
        user_id=current_user.id,
        activity_type="session_ended",
        metadata_json={
            "detail": f"Ended session for course {req.course_id} duration {int(duration)}s",
            "course_id": str(req.course_id),
            "lesson_id": str(req.lesson_id) if req.lesson_id else None
        }
    )
    db.add(log)
    db.commit()
    
    update_user_performance(current_user.id, db)
    return {"success": True, "duration": int(duration)}

@router.get("/performance/me")
def my_performance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    perf = db.query(PerformanceAnalysis).filter(PerformanceAnalysis.user_id == current_user.id).first()
    if not perf:
        perf = update_user_performance(current_user.id, db)
    
    return {
        "success": True,
        "total_learning_time": perf.total_learning_time,
        "average_score": perf.average_score,
        "completion_percentage": perf.completion_percentage,
        "weak_topics": perf.weak_topics,
        "engagement_level": perf.engagement_level,
        "learning_trend": perf.learning_trend
    }
