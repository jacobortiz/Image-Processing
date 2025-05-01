import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.users import current_active_user
from app.db.base import get_db
from app.models.image import Image, ProcessedImage
from app.models.user import User
from app.services.storage import storage_service

router = APIRouter()


@router.get("/{file_path:path}")
async def get_file(
    file_path: str,
    user: Optional[User] = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """
    Serve a file from storage.
    This endpoint will only work for local storage - S3 files are served via presigned URLs.
    """
    if storage_service.storage_type != "local":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only available for local storage",
        )
    
    # Check if this file belongs to the current user
    # Get user_id from path
    path_parts = file_path.split(os.sep)
    if len(path_parts) < 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid file path",
        )
    
    try:
        path_user_id = int(path_parts[0])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid file path",
        )
    
    # Check if user is authorized to access this file
    if path_user_id != user.id and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file",
        )
    
    # Get file path
    try:
        file_full_path = storage_service.get_file_path(file_path)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid storage type for direct file access",
        )
    
    # Check if file exists
    if not os.path.exists(file_full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    
    # Determine content type
    content_type = None
    
    # First, check if this is an original image
    image = db.query(Image).filter(Image.storage_path == file_path).first()
    if image:
        content_type = image.content_type
    else:
        # Check if it's a processed image
        processed_image = db.query(ProcessedImage).filter(ProcessedImage.storage_path == file_path).first()
        if processed_image:
            # Get the original image to determine content type
            original_image = db.query(Image).filter(Image.id == processed_image.original_image_id).first()
            if original_image:
                content_type = original_image.content_type
    
    # Return the file
    return FileResponse(
        file_full_path,
        media_type=content_type,
        filename=os.path.basename(file_path),
    ) 