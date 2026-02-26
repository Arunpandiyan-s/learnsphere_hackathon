import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Configure minimal logger
logger = logging.getLogger("db_setup")
logging.basicConfig(level=logging.INFO)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True
)

# Safe Connectivity Test
try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        logger.info("Database connection successful")
except Exception as e:
    logger.error("Database connection failed. Please ensure DATABASE_URL in .env is correct.")
    # Do not log `e` if it might reveal connection credentials, or log securely

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
