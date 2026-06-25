from app.workers.celery_app import celery
from app.utils.video import extract_frames, get_video_duration, download_video
from app.utils.pose import extract_pose_landmarks, compute_metrics
from app.core.config import settings
from openai import OpenAI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import json
import uuid
import tempfile
import os

sync_engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
)

def get_sync_db():
    return Session(sync_engine)

drill_context = {
    "free_kick": {"ideal_knee_angle": "120-150°", "ideal_hip_angle": "160-175°", "ideal_body_lean": "0.05-0.15", "focus": "plant foot, hip rotation, follow-through"},
    "passing": {"ideal_knee_angle": "140-160°", "ideal_hip_angle": "150-170°", "ideal_body_lean": "0.02-0.10", "focus": "weight transfer, foot angle"},
    "dribbling": {"ideal_knee_angle": "130-155°", "ideal_hip_angle": "145-165°", "ideal_body_lean": "0.10-0.20", "focus": "low center of gravity, balance"},
    "shooting": {"ideal_knee_angle": "110-140°", "ideal_hip_angle": "155-175°", "ideal_body_lean": "0.05-0.15", "focus": "power, hip drive, ankle lock"},
}

@celery.task
def analyze_submission(submission_id: str, video_path: str):
    db = get_sync_db()
    try:
        db.execute(
            text("UPDATE video_submissions SET status='processing' WHERE id=:id"),
            {"id": uuid.UUID(submission_id)}
        )
        db.commit()

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp_path = tmp.name
        download_video(video_path, tmp_path)
        frames = extract_frames(tmp_path)
        get_video_duration(tmp_path)
        os.unlink(tmp_path)

        landmarks = extract_pose_landmarks(frames)
        metrics = compute_metrics(landmarks)

        row = db.execute(
            text("SELECT drill_type FROM video_submissions WHERE id=:id"),
            {"id": uuid.UUID(submission_id)}
        ).fetchone()
        drill_type = row[0] if row else "free_kick"
        ctx = drill_context.get(drill_type, drill_context["free_kick"])

        prompt = f"""You are a professional soccer coach analyzing biomechanical data.
Drill: {drill_type}
Ideal ranges: {json.dumps(ctx)}
Player metrics: {json.dumps(metrics)}
Respond with valid JSON only containing:
- overall_score: integer 0-100
- strengths: list of 2-3 specific observations referencing metric values
- weaknesses: list of 2-3 corrections referencing ideal ranges
- drill_plan: list of 3 weekly drills targeting the weaknesses"""

        client = OpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.OPENAI_API_KEY
        )
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        feedback = json.loads(raw.strip())

        db.execute(
            text("INSERT INTO analysis_results (id, submission_id, metrics, feedback, overall_score) VALUES (:id, :sid, CAST(:metrics AS json), CAST(:feedback AS json), :score)"),
            {
                "id": str(uuid.uuid4()),
                "sid": submission_id,
                "metrics": json.dumps(metrics),
                "feedback": json.dumps(feedback),
                "score": feedback.get("overall_score", 0)
            }
        )
        db.execute(
            text("UPDATE video_submissions SET status='completed' WHERE id=:id"),
            {"id": uuid.UUID(submission_id)}
        )
        db.commit()

    except Exception as e:
        db.execute(
            text("UPDATE video_submissions SET status='failed' WHERE id=:id"),
            {"id": uuid.UUID(submission_id)}
        )
        db.commit()
        raise
    finally:
        db.close()
