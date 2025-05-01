from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel


class UsageRecordBase(BaseModel):
    date: date
    process_type: str
    count: int


class UsageRecordCreate(UsageRecordBase):
    user_id: int


class UsageRecordResponse(UsageRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DailyUsage(BaseModel):
    date: date
    resize_count: int = 0
    ocr_count: int = 0


class UsageSummary(BaseModel):
    total_resize: int = 0
    total_ocr: int = 0
    daily_usage: List[DailyUsage] 