import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.submission import SubmissionStatus

class SubmissionCreate(BaseModel):
    drill_type: str

class SubmissionRead(BaseModel):
    id: uuid.UUID
    drill_type: str
    status: SubmissionStatus
    duration_secs: float | None
    created_at: datetime

    model_config = {"from_attributes": True}