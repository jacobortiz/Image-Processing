"""
Simple script to register a user manually.
Run this script directly to create a user in the database.
"""
import asyncio
import sys
from sqlalchemy import insert

from app.db.base import Base, engine, async_session_maker
from app.models.user import User
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_tables():
    """Create database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created")

async def create_user(email, password):
    """Create a user in the database"""
    # Hash the password
    hashed_password = pwd_context.hash(password)
    
    # Create user using SQLAlchemy Core (not ORM)
    async with async_session_maker() as session:
        # Check if user already exists
        from sqlalchemy import select
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        if result.scalars().first():
            print(f"User with email {email} already exists")
            return
        
        # Insert new user
        stmt = insert(User).values(
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True,  # Make the first user a superuser
            is_verified=True
        )
        await session.execute(stmt)
        await session.commit()
        print(f"User {email} created successfully")

async def main():
    """Main function to run the script"""
    if len(sys.argv) != 3:
        print("Usage: python -m app.register <email> <password>")
        return
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    # Create tables first
    await create_tables()
    
    # Create the user
    await create_user(email, password)

if __name__ == "__main__":
    asyncio.run(main()) 