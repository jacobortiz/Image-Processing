from typing import Optional, Union

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.base import get_db
from app.models.user import User


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        """Create an API key for the user upon registration."""
        print(f"User {user.email} has registered.")
        
        # Import here to avoid circular imports
        from app.auth.api_key import create_api_key
        from app.db.base import async_session_maker
        
        async with async_session_maker() as session:
            await create_api_key(session, user.id, "Default API Key")


# Create a custom SQLAlchemyUserDatabase to properly handle async operations
class AsyncSQLAlchemyUserDatabase(SQLAlchemyUserDatabase):
    async def _get_user(self, statement):
        results = await self.session.execute(statement)
        return results.scalars().first()
    
    async def get_by_email(self, email: str):
        statement = select(self.user_table).where(self.user_table.email == email)
        return await self._get_user(statement)
    
    async def get_by_id(self, id: int):
        statement = select(self.user_table).where(self.user_table.id == id)
        return await self._get_user(statement)
    
    async def create(self, user_create):
        # Handle both UserCreate objects and dictionaries
        if hasattr(user_create, "create_update_dict"):
            user_dict = user_create.create_update_dict()
        else:
            user_dict = user_create
            
        user = self.user_table(**user_dict)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def update(self, user_update, user):
        if hasattr(user_update, "create_update_dict"):
            user_dict = user_update.create_update_dict()
        else:
            user_dict = user_update
            
        for key, value in user_dict.items():
            setattr(user, key, value)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def delete(self, user):
        await self.session.delete(user)
        await self.session.commit()


async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield AsyncSQLAlchemyUserDatabase(session, User)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True) 