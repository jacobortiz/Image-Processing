from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, images, files, usage

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"]) 