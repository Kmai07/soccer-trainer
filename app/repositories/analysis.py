from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    metrics: Mapped[dict] = mapped_column(JSON)
    feedback: Mapped[dict] = mapped_column(JSON)
    overall_score: Mapped[int] = mapped_column(Integer)


class AnalysisRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        submission_id: uuid.UUID,
        metrics: dict,
        feedback: dict,
        score: int
    ) -> AnalysisResult:
        result = AnalysisResult(
            submission_id=submission_id,
            metrics=metrics,
            feedback=feedback,
            overall_score=score
        )
        self.db.add(result)
        await self.db.flush()
        await self.db.refresh(result)
        return result

    async def get_by_submission(self, submission_id: uuid.UUID) -> AnalysisResult | None:
        result = await self.db.execute(
            select(AnalysisResult).where(
                AnalysisResult.submission_id == submission_id
            )
        )
        return result.scalars().first()