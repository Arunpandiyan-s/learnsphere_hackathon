import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    instructor = "instructor"
    learner = "learner"

class LessonType(str, enum.Enum):
    video = "video"
    document = "document"
    quiz = "quiz"

class ProgressStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"

class CourseStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
