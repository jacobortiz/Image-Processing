import os
import uuid
from io import BytesIO
from typing import Tuple, Optional, Dict, Any

from PIL import Image
import pytesseract

from app.core.config import settings
from app.services.storage import storage_service

pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


class ImageService:
    """Service for handling image processing operations."""

    @staticmethod
    def get_image_dimensions(file_path: str) -> Tuple[int, int]:
        """Get the dimensions of an image."""
        with Image.open(file_path) as img:
            return img.size  # Returns (width, height)

    @staticmethod
    def resize_image(
        file_path: str,
        width: int,
        user_id: int,
        maintain_aspect_ratio: bool = True,
    ) -> Dict[str, Any]:
        """
        Resize an image to the specified width.
        Returns the new file path and dimensions.
        """
        with Image.open(file_path) as img:
            original_width, original_height = img.size
            
            # Calculate new dimensions
            if maintain_aspect_ratio:
                ratio = original_height / original_width
                new_height = int(width * ratio)
            else:
                new_height = original_height
                
            # Resize image
            resized_img = img.resize((width, new_height), Image.LANCZOS)
            
            # Save resized image
            img_byte_arr = BytesIO()
            resized_img.save(img_byte_arr, format=img.format or 'JPEG')
            img_byte_arr.seek(0)
            
            # Generate filename
            filename = f"{uuid.uuid4()}.{img.format.lower() if img.format else 'jpg'}"
            
            # Save to storage
            storage_path = storage_service.save_binary(
                img_byte_arr.getvalue(),
                user_id=user_id,
                folder="resized",
                filename=filename,
            )
            
            return {
                "storage_path": storage_path,
                "width": width,
                "height": new_height,
            }

    @staticmethod
    def extract_text(file_path: str, lang: str = "eng") -> str:
        """Extract text from an image using OCR."""
        if settings.STORAGE_TYPE == "local":
            # If local storage, we can access the file directly
            text = pytesseract.image_to_string(file_path, lang=lang)
        else:
            # For S3 or other remote storage, we need to load the image first
            with Image.open(file_path) as img:
                text = pytesseract.image_to_string(img, lang=lang)
                
        return text


# Create a singleton instance
image_service = ImageService() 