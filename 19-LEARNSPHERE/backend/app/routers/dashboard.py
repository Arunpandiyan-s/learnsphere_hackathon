from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.models.enums import CourseStatus
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/metrics")
def get_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "learner":
        raise HTTPException(status_code=403, detail="Learners cannot view dashboard metrics")

    # Get relevant courses
    if current_user.role == "admin":
        courses = db.query(Course).all()
    else:
        courses = db.query(Course).filter(Course.created_by == current_user.id).all()
        
    course_ids = [c.id for c in courses]
    
    # Get enrollments for these courses
    enrollments = db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).all()
    
    metrics = {
        "total_participants": len(enrollments),
        "yet_to_start": sum(1 for e in enrollments if e.status == CourseStatus.NOT_STARTED),
        "in_progress": sum(1 for e in enrollments if e.status == CourseStatus.IN_PROGRESS),
        "completed": sum(1 for e in enrollments if e.status == CourseStatus.COMPLETED)
    }
            
    return metrics

@router.get("/learner-progress")
def get_learner_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "learner":
        raise HTTPException(status_code=403, detail="Learners cannot view learner progress table")
        
    if current_user.role == "admin":
        courses = db.query(Course).all()
    else:
        courses = db.query(Course).filter(Course.created_by == current_user.id).all()
        
    course_ids = [c.id for c in courses]
    enrollments = db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).all()
    
    result = []
    
    for enrollment in enrollments:
        learner = db.query(User).filter(User.id == enrollment.learner_id).first()
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        
        if not learner or not course:
            continue
            
        result.append({
            "course_name": course.title,
            "learner_name": learner.email.split('@')[0], # Fallback name
            "learner_email": learner.email,
            "enrolled_date": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "start_date": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "time_spent": 0, # Placeholder
            "completion_percentage": enrollment.progress_percent,
            "status": enrollment.status.value.lower()
        })
        
    return result
