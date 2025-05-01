from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class APIKeyBase(BaseModel):
    name: Optional[str] = "Default API Key"


class APIKeyCreate(APIKeyBase):
    pass


class APIKeyResponse(APIKeyBase):
    id: int
    key: str
    name: str
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class APIKeyDB(APIKeyResponse):
    user_id: int
    is_active: bool

    class Config:
        orm_mode = True 