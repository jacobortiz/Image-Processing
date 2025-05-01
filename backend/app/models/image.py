from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="images")
    processed_images = relationship("ProcessedImage", back_populates="original_image", cascade="all, delete-orphan")


class ProcessedImage(Base):
    __tablename__ = "processed_images"

    id = Column(Integer, primary_key=True, index=True)
    original_image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    storage_path = Column(String(512), nullable=False)
    process_type = Column(String(50), nullable=False)  # "resize" or "ocr"
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    ocr_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    original_image = relationship("Image", back_populates="processed_images") 