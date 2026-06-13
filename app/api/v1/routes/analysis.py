import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.repositories.analysis import AnalysisRepository
from app.repositories.submission import SubmissionRepository
from app.models.user import User
from fastapi import HTTPException

router = APIRouter(prefix="/submissions", tags=["analysis"])

@router.get("/{submission_id}/analysis")
async def get_analysis(
    submission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submission_repo = SubmissionRepository(db)
    submission = await submission_repo.get_by_id(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    analysis_repo = AnalysisRepository(db)
    analysis = await analysis_repo.get_by_submission(submission_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not ready yet")

    return {
        "submission_id": submission_id,
        "status": submission.status,
        "metrics": analysis.metrics,
        "feedback": analysis.feedback,
        "overall_score": analysis.overall_score
    }