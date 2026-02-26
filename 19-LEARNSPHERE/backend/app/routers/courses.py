from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.enums import CourseStatus
from app.models.lesson import Lesson
from app.auth.dependencies import get_current_user

router = APIRouter()

class CourseCreate(BaseModel):
    course_name: str
    description: Optional[str] = None

class CourseResponse(BaseModel):
    id: str
    course_name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.post("", response_model=CourseResponse)
def create_course(req: CourseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if current_user.role not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Only instructors and Admin can create courses")
            
        course = Course(
            course_name=req.course_name,
            description=req.description,
            created_by=current_user.id
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        print("COURSE CREATED:", course.id)
        return course
    except Exception as e:
        db.rollback()
        print("COURSE CREATE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{course_id}", response_model=CourseResponse)
def edit_course(course_id: uuid.UUID, req: CourseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        if current_user.role != "admin" and course.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to edit this course")
            
        course.course_name = req.course_name
        if req.description is not None:
            course.description = req.description
            
        db.commit()
        db.refresh(course)
        return course
    except Exception as e:
        db.rollback()
        print("ERROR in edit_course:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-courses")
def my_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if current_user.role != "learner":
            raise HTTPException(status_code=403, detail="Only learners have enrolled courses")
            
        results = (
            db.query(Course, Enrollment)
            .join(Enrollment, Course.id == Enrollment.course_id)
            .filter(Enrollment.learner_id == current_user.id)
            .all()
        )
        
        return [
            {
                "course_id": course.id,
                "course_name": course.course_name,
                "description": course.description,
                "enrollment_id": enrollment.id,
                "progress_percent": enrollment.progress_percent,
                "status": enrollment.status
            }
            for course, enrollment in results
        ]
    except Exception as e:
        print("ERROR in my_courses:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course
    except Exception as e:
        print("ERROR in get_course:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[CourseResponse])
def list_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return db.query(Course).all()
    except Exception as e:
        print("ERROR in list_courses:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{course_id}/enroll")
def enroll_course(course_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if current_user.role != "learner":
            raise HTTPException(status_code=403, detail="Only learners can enroll")
            
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        existing = db.query(Enrollment).filter(
            Enrollment.course_id == course_id, 
            Enrollment.learner_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already enrolled in this course")
            
        enrollment = Enrollment(
            course_id=course_id,
            learner_id=current_user.id,
            progress_percent=0,
            status=CourseStatus.NOT_STARTED
        )
        
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        
        return {
            "success": True,
            "status": enrollment.status,
            "progress": enrollment.progress_percent
        }
    except Exception as e:
        db.rollback()
        print("ERROR in enroll_course:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


