import os
from sqlalchemy import text
from sqlalchemy import create_engine
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    print("Executing drops...")
    conn.execute(text("DROP TABLE IF EXISTS performance_analysis CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS user_activity_logs CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS quiz_attempts CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS learning_sessions CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS ai_conversations CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS lesson_progress CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS lessons CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS course_enrollments CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS enrollments CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS courses CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS user_profiles CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
    conn.execute(text("DROP TYPE IF EXISTS user_role CASCADE;"))
    conn.execute(text("DROP TYPE IF EXISTS lesson_type CASCADE;"))
    conn.execute(text("DROP TYPE IF EXISTS progress_status CASCADE;"))
    conn.execute(text("DROP TYPE IF EXISTS course_status CASCADE;"))
    conn.commit()
    print("Database reset successfully.")
