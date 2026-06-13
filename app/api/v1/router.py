from fastapi import APIRouter
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.submissions import router as submissions_router
from app.api.v1.routes.analysis import router as analysis_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(submissions_router)
api_router.include_router(analysis_router)