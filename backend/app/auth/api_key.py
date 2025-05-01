import secrets
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.models.api_key import APIKey
from app.models.user import User


def generate_api_key() -> str:
    """Generate a secure API key."""
    return secrets.token_hex(32)


async def create_api_key(db: AsyncSession, user_id: int, name: Optional[str] = None) -> APIKey:
    """Create a new API key for a user."""
    api_key = APIKey(
        user_id=user_id,
        key=generate_api_key(),
        name=name or "Default API Key",
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return api_key


async def get_api_key(db: AsyncSession, key: str) -> Optional[APIKey]:
    """Get API key by value."""
    result = await db.execute(
        select(APIKey).where(APIKey.key == key, APIKey.is_active == True)
    )
    return result.scalars().first()


async def update_api_key_usage(db: AsyncSession, api_key: APIKey) -> None:
    """Update the last used timestamp of an API key."""
    api_key.last_used_at = datetime.utcnow()
    await db.commit()


async def get_user_by_api_key(
    api_key: str = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get a user by API key from header."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
        )

    # Get API key from database
    api_key_obj = await get_api_key(db, api_key)
    if not api_key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Update last used timestamp
    await update_api_key_usage(db, api_key_obj)

    # Get the user associated with this API key
    result = await db.execute(
        select(User).where(User.id == api_key_obj.user_id, User.is_active == True)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user 