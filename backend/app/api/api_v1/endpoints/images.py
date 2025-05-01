from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth.api_key import get_user_by_api_key
from app.auth.users import current_active_user
from app.db.base import get_db
from app.models.image import Image, ProcessedImage
from app.models.user import User
from app.schemas.image import (
    ImageResponse,
    ResizeRequest,
    OCRRequest,
    ResizeResponse,
    OCRResponse,
)
from app.services.image import image_service
from app.services.storage import storage_service
from app.services.usage import usage_service

router = APIRouter()


def validate_image(file: UploadFile) -> None:
    """Validate that the uploaded file is an image."""
    content_type = file.content_type
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG or PNG)",
        )
    
    # Check allowed formats
    allowed_formats = ["image/jpeg", "image/png"]
    if content_type not in allowed_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format. Allowed formats: {', '.join(allowed_formats)}",
        )


@router.post("", response_model=ImageResponse)
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """Upload an image (UI access)."""
    validate_image(file)
    
    # Save the file
    storage_path = await storage_service.save_file(file, user.id)
    
    # If local storage, get the file path to extract dimensions
    full_path = storage_service.get_file_path(storage_path) if storage_service.storage_type == "local" else None
    
    # Create image record
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)
    
    # Get image dimensions if possible
    width = None
    height = None
    if full_path:
        try:
            width, height = image_service.get_image_dimensions(full_path)
        except Exception:
            pass  # Continue even if we can't get dimensions
    
    image = Image(
        user_id=user.id,
        original_filename=file.filename,
        storage_path=storage_path,
        content_type=file.content_type,
        size_bytes=file_size,
        width=width,
        height=height,
    )
    
    db.add(image)
    db.commit()
    db.refresh(image)
    
    # Return response with URL
    return {
        **image.__dict__,
        "url": storage_service.get_file_url(image.storage_path),
    }


@router.post("/api/upload", response_model=ImageResponse)
async def upload_image_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_user_by_api_key),
    db: Session = Depends(get_db),
):
    """Upload an image (API access)."""
    # Reuse the same logic as the UI version
    return await upload_image(background_tasks, file, user, db)


@router.get("", response_model=List[ImageResponse])
async def list_images(
    user: User = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """List all images uploaded by the current user."""
    images = db.query(Image).filter(Image.user_id == user.id).all()
    
    # Add URLs to each image
    for image in images:
        image.url = storage_service.get_file_url(image.storage_path)
    
    return images


@router.post("/{image_id}/resize", response_model=ResizeResponse)
async def resize_image(
    image_id: int,
    resize_data: ResizeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """Resize an image (UI access)."""
    # Get the image
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == user.id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Get the full path if using local storage
    full_path = storage_service.get_file_path(image.storage_path) if storage_service.storage_type == "local" else None
    
    # Resize the image
    resize_result = image_service.resize_image(
        full_path or image.storage_path,
        width=resize_data.width,
        user_id=user.id,
        maintain_aspect_ratio=resize_data.maintain_aspect_ratio,
    )
    
    # Create a record for the processed image
    processed_image = ProcessedImage(
        original_image_id=image.id,
        storage_path=resize_result["storage_path"],
        process_type="resize",
        width=resize_result["width"],
        height=resize_result["height"],
    )
    
    db.add(processed_image)
    db.commit()
    db.refresh(processed_image)
    
    # Record usage (in background)
    background_tasks.add_task(
        usage_service.record_usage,
        db=db,
        user_id=user.id,
        process_type="resize",
    )
    
    # Return response
    return {
        "id": processed_image.id,
        "original_image_id": image.id,
        "url": storage_service.get_file_url(processed_image.storage_path),
        "width": processed_image.width,
        "height": processed_image.height,
    }


@router.post("/api/{image_id}/resize", response_model=ResizeResponse)
async def resize_image_api(
    image_id: int,
    resize_data: ResizeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_user_by_api_key),
    db: Session = Depends(get_db),
):
    """Resize an image (API access)."""
    # Reuse the same logic as the UI version
    return await resize_image(image_id, resize_data, background_tasks, user, db)


@router.post("/{image_id}/ocr", response_model=OCRResponse)
async def extract_text_from_image(
    image_id: int,
    ocr_data: OCRRequest = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """Extract text from an image using OCR (UI access)."""
    # Default OCR parameters if none provided
    if not ocr_data:
        ocr_data = OCRRequest()
    
    # Get the image
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == user.id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Get the full path if using local storage
    full_path = storage_service.get_file_path(image.storage_path) if storage_service.storage_type == "local" else None
    
    # Extract text using OCR
    try:
        extracted_text = image_service.extract_text(
            full_path or image.storage_path,
            lang=ocr_data.lang,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during OCR processing: {str(e)}",
        )
    
    # Create a record for the processed image (in this case, just storing the OCR result)
    processed_image = ProcessedImage(
        original_image_id=image.id,
        storage_path=image.storage_path,  # Reuse the same image
        process_type="ocr",
        ocr_text=extracted_text,
    )
    
    db.add(processed_image)
    db.commit()
    db.refresh(processed_image)
    
    # Record usage (in background)
    background_tasks.add_task(
        usage_service.record_usage,
        db=db,
        user_id=user.id,
        process_type="ocr",
    )
    
    # Return response
    return {
        "id": processed_image.id,
        "original_image_id": image.id,
        "url": storage_service.get_file_url(image.storage_path),
        "text": processed_image.ocr_text,
    }


@router.post("/api/{image_id}/ocr", response_model=OCRResponse)
async def extract_text_from_image_api(
    image_id: int,
    ocr_data: OCRRequest = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(get_user_by_api_key),
    db: Session = Depends(get_db),
):
    """Extract text from an image using OCR (API access)."""
    # Reuse the same logic as the UI version
    return await extract_text_from_image(image_id, ocr_data, background_tasks, user, db) 