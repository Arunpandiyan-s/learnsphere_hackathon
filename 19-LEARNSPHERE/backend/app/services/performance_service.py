import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.tracking import LearningSession, QuizAttempt, PerformanceAnalysis
from app.models.progress import LessonProgress
from app.models.course import Enrollment, Course
from app.models.lesson import Lesson

def update_user_performance(user_id: uuid.UUID, db: Session):
    """
    Recalculates metrics for a user and updates or creates their PerformanceAnalysis record.
    """
    
    # 1. Total Learning Time (Seconds)
    total_time_res = db.query(func.sum(LearningSession.duration_seconds)).filter(
        LearningSession.user_id == user_id
    ).scalar()
    total_learning_time = total_time_res or 0

    # 2. Average Quiz Score
    avg_score_res = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.user_id == user_id
    ).scalar()
    average_score = float(avg_score_res) if avg_score_res else 0.0

    # 3. Overall Completion Percentage (avg of enrolled courses)
    avg_completion_res = db.query(func.avg(Enrollment.progress_percent)).filter(
        Enrollment.learner_id == user_id
    ).scalar()
    completion_percentage = float(avg_completion_res) if avg_completion_res else 0.0

    # 4. Weak topics / engagement trend logic (simplified heuristic)
    # Weak topics: quizzes where score < 60
    weak_quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user_id, 
        QuizAttempt.score < 60
    ).all()
    
    weak_topics_set = set()
    for w in weak_quizzes:
        lesson = db.query(Lesson).filter(Lesson.id == w.quiz_id).first()
        if lesson:
            weak_topics_set.add(lesson.title)
    
    weak_topics = list(weak_topics_set)[:5] # Keep it compact
    
    # 5. Engagement level
    engagement_level = "low"
    learning_sessions_count = db.query(LearningSession).filter(LearningSession.user_id == user_id).count()
    if learning_sessions_count > 20 and total_learning_time > 3600:
        engagement_level = "high"
    elif learning_sessions_count > 5:
        engagement_level = "medium"
        
    # 6. Learning Trend
    # Compare recent 3 quizzes with overall average
    recent_quizzes = db.query(QuizAttempt).filter( QuizAttempt.user_id == user_id ).order_by(QuizAttempt.created_at.desc()).limit(3).all()
    learning_trend = "stable"
    if recent_quizzes and average_score > 0:
        recent_avg = sum([q.score for q in recent_quizzes]) / len(recent_quizzes)
        if recent_avg - average_score > 5:
            learning_trend = "improving"
        elif average_score - recent_avg > 5:
            learning_trend = "declining"
            
    # Upsert the Performance record
    performance = db.query(PerformanceAnalysis).filter(PerformanceAnalysis.user_id == user_id).first()
    
    if not performance:
        performance = PerformanceAnalysis(user_id=user_id)
        db.add(performance)
        
    performance.total_learning_time = total_learning_time
    performance.average_score = average_score
    performance.completion_percentage = completion_percentage
    performance.weak_topics = weak_topics
    performance.engagement_level = engagement_level
    performance.learning_trend = learning_trend
    
    db.commit()
    db.refresh(performance)
    
    return performance
