from app.db.base_class import Base

# IMPORT ALL MODELS BELOW (MANDATORY)
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.models.ai_conversation import AIConversation
from app.models.profile import UserProfile
from app.models.tracking import LearningSession, QuizAttempt, UserActivityLog, PerformanceAnalysis
