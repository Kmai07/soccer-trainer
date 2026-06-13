import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.services.submission import SubmissionService
from app.schemas.submission import SubmissionRead
from app.models.user import User

router = APIRouter(prefix="/submissions", tags=["submissions"])

@router.post("", response_model=SubmissionRead)
async def create_submission(
    file: UploadFile = File(...),
    drill_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubmissionService(db)
    return await service.create_submission(file, drill_type, current_user)

@router.get("", response_model=list[SubmissionRead])
async def list_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubmissionService(db)
    return await service.list_submissions(current_user)

@router.get("/{submission_id}", response_model=SubmissionRead)
async def get_submission(
    submission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubmissionService(db)
    return await service.get_submission(submission_id, current_user)