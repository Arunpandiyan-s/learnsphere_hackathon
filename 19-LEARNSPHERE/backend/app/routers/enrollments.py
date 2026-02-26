from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.enums import CourseStatus
from app.auth.dependencies import get_current_user

router = APIRouter()

class ProgressUpdateReq(BaseModel):
    progress_percent: int

@router.patch("/{enrollment_id}/progress")
def update_progress(enrollment_id: uuid.UUID, req: ProgressUpdateReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=403, detail="Only learners can update progress")
        
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    if enrollment.learner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your enrollment")
        
    enrollment.progress_percent = max(0, min(100, req.progress_percent))
    
    if enrollment.progress_percent == 0:
        enrollment.status = CourseStatus.NOT_STARTED
    elif enrollment.progress_percent == 100:
        enrollment.status = CourseStatus.COMPLETED
    else:
        enrollment.status = CourseStatus.IN_PROGRESS
        
    db.commit()
    db.refresh(enrollment)
    
    return {
        "success": True,
        "status": enrollment.status,
        "progress": enrollment.progress_percent
    }
