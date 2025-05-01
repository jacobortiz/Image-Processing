import os
import uuid
from typing import Optional, BinaryIO

import boto3
from fastapi import UploadFile

from app.core.config import settings


class StorageService:
    """Service for handling file storage operations."""

    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        if self.storage_type == "s3":
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            self.bucket_name = settings.S3_BUCKET_NAME
        else:
            # Create local storage directory if it doesn't exist
            os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)

    async def save_file(self, file: UploadFile, user_id: int, folder: str = "originals") -> str:
        """Save a file to storage and return the path."""
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        filename = f"{uuid.uuid4()}{ext}"
        
        # Create path based on user_id/folder/filename
        relative_path = os.path.join(str(user_id), folder, filename)
        
        if self.storage_type == "s3":
            # Upload to S3
            file_content = await file.read()
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=relative_path,
                Body=file_content,
                ContentType=file.content_type,
            )
            # Reset file position after reading
            await file.seek(0)
        else:
            # Save to local filesystem
            local_path = os.path.join(settings.LOCAL_STORAGE_PATH, relative_path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            file_content = await file.read()
            with open(local_path, "wb") as f:
                f.write(file_content)
            
            # Reset file position after reading
            await file.seek(0)
            
        return relative_path

    def save_binary(self, data: bytes, user_id: int, folder: str, filename: str) -> str:
        """Save binary data to storage and return the path."""
        # Create path based on user_id/folder/filename
        relative_path = os.path.join(str(user_id), folder, filename)
        
        if self.storage_type == "s3":
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=relative_path,
                Body=data,
            )
        else:
            # Save to local filesystem
            local_path = os.path.join(settings.LOCAL_STORAGE_PATH, relative_path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, "wb") as f:
                f.write(data)
                
        return relative_path

    def get_file_url(self, file_path: str) -> str:
        """Get a URL for accessing the file."""
        if self.storage_type == "s3":
            # Generate a presigned URL for S3
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=3600,  # URL expires in 1 hour
            )
        else:
            # For local storage, we'll construct a URL relative to our API
            return f"/api/v1/files/{file_path}"

    def get_file_path(self, file_path: str) -> str:
        """Get the full file path on the local filesystem."""
        if self.storage_type == "local":
            return os.path.join(settings.LOCAL_STORAGE_PATH, file_path)
        raise ValueError("get_file_path is only valid for local storage")

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage."""
        try:
            if self.storage_type == "s3":
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=file_path,
                )
            else:
                local_path = os.path.join(settings.LOCAL_STORAGE_PATH, file_path)
                if os.path.exists(local_path):
                    os.remove(local_path)
            return True
        except Exception:
            return False


# Create a singleton instance
storage_service = StorageService() 