from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, HttpUrl


class ImageBase(BaseModel):
    original_filename: str
    content_type: str
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None


class ImageCreate(ImageBase):
    storage_path: str
    user_id: int


class ImageResponse(ImageBase):
    id: int
    storage_path: str
    url: str
    created_at: datetime

    class Config:
        orm_mode = True


class ProcessedImageBase(BaseModel):
    original_image_id: int
    process_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    ocr_text: Optional[str] = None


class ProcessedImageCreate(ProcessedImageBase):
    storage_path: str


class ProcessedImageResponse(ProcessedImageBase):
    id: int
    storage_path: str
    url: str
    created_at: datetime

    class Config:
        orm_mode = True


class ResizeRequest(BaseModel):
    width: int
    maintain_aspect_ratio: bool = True


class OCRRequest(BaseModel):
    lang: Optional[str] = "eng"


class ResizeResponse(BaseModel):
    id: int
    original_image_id: int
    url: str
    width: int
    height: int

    class Config:
        orm_mode = True


class OCRResponse(BaseModel):
    id: int
    original_image_id: int
    url: str
    text: str

    class Config:
        orm_mode = True 