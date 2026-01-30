from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# create_engine управляет пулом соединений к БД
# pool_pre_ping=True важен для MySQL, чтобы не отваливаться при простое
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency Injection для FastAPI
# Позволяет получать сессию БД в каждом запросе и автоматически закрывать её
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
