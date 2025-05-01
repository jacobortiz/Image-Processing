from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.base import Base, engine

# Create startup event handler
@asyncio.coroutine
async def startup_db_client():
    # Only create tables if db file doesn't exist or is empty
    db_path = settings.SQLALCHEMY_DATABASE_URI.replace("sqlite+aiosqlite:///", "")
    if not os.path.exists(db_path) or os.path.getsize(db_path) == 0:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Register startup event
@app.on_event("startup")
async def startup():
    await startup_db_client()

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)