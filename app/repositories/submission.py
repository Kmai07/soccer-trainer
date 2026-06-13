from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.submission import VideoSubmission, SubmissionStatus
import uuid

class SubmissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: uuid.UUID, drill_type: str, s3_key: str) -> VideoSubmission:
        submission = VideoSubmission(
            user_id=user_id,
            drill_type=drill_type,
            s3_key=s3_key
        )
        self.db.add(submission)
        await self.db.flush()
        await self.db.refresh(submission)
        return submission

    async def get_by_id(self, submission_id: uuid.UUID) -> VideoSubmission | None:
        result = await self.db.execute(
            select(VideoSubmission).where(VideoSubmission.id == submission_id)
        )
        return result.scalars().first()

    async def update_status(self, submission_id: uuid.UUID, status: SubmissionStatus) -> None:
        submission = await self.get_by_id(submission_id)
        if submission:
            submission.status = status
            await self.db.flush()

    async def list_by_user(self, user_id: uuid.UUID) -> list[VideoSubmission]:
        result = await self.db.execute(
            select(VideoSubmission).where(VideoSubmission.user_id == user_id)
        )
        return result.scalars().all()