from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.users import current_active_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.usage import UsageSummary
from app.services.usage import usage_service

router = APIRouter()


@router.get("", response_model=UsageSummary)
async def get_usage_summary(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """Get usage summary for the current user."""
    return usage_service.get_usage_summary(db, user.id, days=days) 