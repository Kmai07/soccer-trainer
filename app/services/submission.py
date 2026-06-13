import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.submission import SubmissionRepository
from app.models.user import User
from app.workers.tasks import analyze_submission
from app.utils.video import upload_video

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

class SubmissionService:
    def __init__(self, db: AsyncSession):
        self.repo = SubmissionRepository(db)

    async def create_submission(
        self, file: UploadFile, drill_type: str, user: User
    ):
        extension = Path(file.filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {extension} not allowed"
            )

        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}{extension}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size
        if file_size > MAX_FILE_SIZE:
            file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 50MB"
            )

        cloudinary_url = upload_video(str(file_path))
        file_path.unlink()

        submission = await self.repo.create(
            user_id=user.id,
            drill_type=drill_type,
            s3_key=cloudinary_url
        )
        print(f"Dispatching task for submission {submission.id}")
        analyze_submission.delay(str(submission.id), cloudinary_url)
        print("Task dispatched")
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