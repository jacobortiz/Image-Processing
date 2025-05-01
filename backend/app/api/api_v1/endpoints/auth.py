from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.users import fastapi_users, auth_backend
from app.auth.api_key import create_api_key, get_api_key
from app.db.base import get_db
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyResponse
from app.schemas.user import UserRead, UserCreate, UserUpdate

router = APIRouter()

# Include FastAPI Users routes
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@router.post("/api-keys", response_model=APIKeyResponse, tags=["api-keys"])
async def create_user_api_key(
    api_key_in: APIKeyCreate,
    user: UserRead = Depends(fastapi_users.current_user(active=True)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key for the current user."""
    api_key = await create_api_key(db, user.id, api_key_in.name)
    return api_key


@router.get("/api-keys", response_model=list[APIKeyResponse], tags=["api-keys"])
async def get_user_api_keys(
    user: UserRead = Depends(fastapi_users.current_user(active=True)),
    db: AsyncSession = Depends(get_db),
):
    """Get all API keys for the current user."""
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == user.id)
    )
    api_keys = result.scalars().all()
    return api_keys


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["api-keys"])
async def delete_user_api_key(
    key_id: int,
    user: UserRead = Depends(fastapi_users.current_user(active=True)),
    db: AsyncSession = Depends(get_db),
):
    """Delete an API key belonging to the current user."""
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id)
    )
    api_key = result.scalars().first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    await db.delete(api_key)
    await db.commit()
    return None 