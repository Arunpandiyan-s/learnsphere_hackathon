import uuid
import json
from sqlalchemy.orm import Session
from app.models.tracking import PerformanceAnalysis, UserActivityLog
from app.models.course import Enrollment, Course

def build_ai_context(user_id: uuid.UUID, db: Session) -> str:
    """
    Builds a JSON context object for the AI using tracking and performance data.
    """
    # 1. Courses
    enrollments = db.query(Enrollment, Course.title)\
        .join(Course, Course.id == Enrollment.course_id)\
        .filter(Enrollment.learner_id == user_id)\
        .all()
        
    courses_list = [
        {"name": title, "completion": float(enroll.progress_percent)}
        for enroll, title in enrollments
    ]
    
    # 2. Performance
    performance = db.query(PerformanceAnalysis).filter(PerformanceAnalysis.user_id == user_id).first()
    perf_dict = {}
    if performance:
        perf_dict = {
            "average_score": performance.average_score,
            "weak_topics": performance.weak_topics,
            "learning_trend": performance.learning_trend,
            "engagement": performance.engagement_level
        }
    else:
        perf_dict = {
            "average_score": 0,
            "weak_topics": [],
            "learning_trend": "unknown",
            "engagement": "unknown"
        }
        
    # 3. Recent Activity
    activities = db.query(UserActivityLog)\
        .filter(UserActivityLog.user_id == user_id)\
        .order_by(UserActivityLog.created_at.desc())\
        .limit(3)\
        .all()
        
    activity_list = []
    for a in activities:
        meta = a.metadata_json or {}
        detail = meta.get('detail', '')
        activity_list.append(f"{a.activity_type}: {detail}")
        
    context = {
        "courses": courses_list,
        "performance": perf_dict,
        "recent_activity": activity_list
    }
    
    return json.dumps(context, indent=2)
