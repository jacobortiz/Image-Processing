from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# Convert SQLite URL to async format if needed
database_url = settings.SQLALCHEMY_DATABASE_URI
if database_url.startswith('sqlite:'):
    database_url = database_url.replace('sqlite:', 'sqlite+aiosqlite:')

# Create async engine and session
engine = create_async_engine(database_url, echo=True)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close() 