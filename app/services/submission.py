import uuid
import shutil
import logging
import threading
from pathlib import Path

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.submission import SubmissionRepository
from app.models.user import User

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def _run_analysis(submission_id: str, file_path: str) -> None:
    """Run analysis via Celery when available, otherwise in-process."""
    from app.workers.tasks import analyze_submission

    try:
        analyze_submission.delay(submission_id, file_path)
        return
    except Exception:
        logger.warning(
            "Celery unavailable for submission %s — running in-process",
            submission_id,
            exc_info=True,
        )

    try:
        analyze_submission(submission_id, file_path)
    except Exception:
        logger.exception("In-process analysis failed for submission %s", submission_id)


def _queue_analysis(submission_id: str, file_path: str) -> None:
    """Fire-and-forget so upload never waits on Redis/Celery."""
    threading.Thread(
        target=_run_analysis,
        args=(submission_id, file_path),
        daemon=True,
    ).start()


class SubmissionService:
    def __init__(self, db: AsyncSession):
        self.repo = SubmissionRepository(db)

    async def create_submission(
        self, file: UploadFile, drill_type: str, user: User
    ):
        filename = file.filename or "upload.mp4"
        extension = Path(filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {extension or '(none)'} not allowed. Use MP4 or MOV.",
            )

        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}{extension}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size
        if file_size == 0:
            file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
        if file_size > MAX_FILE_SIZE:
            file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 50MB",
            )

        submission = await self.repo.create(
            user_id=user.id,
            drill_type=drill_type,
            s3_key=str(file_path),
        )

        _queue_analysis(str(submission.id), str(file_path))

        return submission

    async def get_submission(self, submission_id: uuid.UUID, user: User):
        submission = await self.repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        if submission.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return submission

    async def list_submissions(self, user: User):
        return await self.repo.list_by_user(user.id)
