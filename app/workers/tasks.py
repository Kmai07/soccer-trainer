from app.workers.celery_app import celery
from app.utils.video import extract_frames, get_video_duration, download_video
from app.utils.pose import extract_pose_landmarks, compute_metrics
from app.db.session import AsyncSessionLocal
from app.repositories.submission import SubmissionRepository
from app.repositories.analysis import AnalysisRepository
from app.models.submission import SubmissionStatus
from openai import OpenAI
from app.core.config import settings
import json
import uuid
import tempfile
import os

drill_context = {
    "free_kick": {
        "ideal_knee_angle": "120-150° at ball contact",
        "ideal_hip_angle": "160-175° for full extension",
        "ideal_body_lean": "0.05-0.15 slight forward lean",
        "focus": "plant foot stability, hip rotation, follow-through arc"
    },
    "passing": {
        "ideal_knee_angle": "140-160° controlled bend",
        "ideal_hip_angle": "150-170° stable hip",
        "ideal_body_lean": "0.02-0.10 minimal lean",
        "focus": "weight transfer, foot angle at contact, follow-through direction"
    },
    "dribbling": {
        "ideal_knee_angle": "130-155° agile bend",
        "ideal_hip_angle": "145-165° low center of gravity",
        "ideal_body_lean": "0.10-0.20 forward lean for speed",
        "focus": "low center of gravity, quick foot turnover, balance"
    },
    "shooting": {
        "ideal_knee_angle": "110-140° powerful bend",
        "ideal_hip_angle": "155-175° full hip drive",
        "ideal_body_lean": "0.05-0.15 slight lean over ball",
        "focus": "power generation, hip drive, ankle lock at contact"
    }
}

""""
@celery.task
def analyze_submission(submission_id: str, video_path: str):
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_analyze(submission_id, video_path))
    finally:
        loop.close()"""

@celery.task
def analyze_submission(submission_id: str, video_path: str):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_analyze(submission_id, video_path))
    finally:
        loop.close()
        asyncio.set_event_loop(asyncio.new_event_loop())


async def _analyze(submission_id: str, video_path: str):
    async with AsyncSessionLocal() as db:
        submission_repo = SubmissionRepository(db)
        analysis_repo = AnalysisRepository(db)

        submission = await submission_repo.get_by_id(submission_id)
        await submission_repo.update_status(
            submission_id, SubmissionStatus.processing
        )

        try:
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp_path = tmp.name
            download_video(video_path, tmp_path)
            frames = extract_frames(tmp_path)
            duration = get_video_duration(tmp_path)
            os.unlink(tmp_path)

            landmarks = extract_pose_landmarks(frames)
            metrics = compute_metrics(landmarks)

            context = drill_context.get(
                submission.drill_type,
                drill_context["free_kick"]
            )

            prompt = f"""You are a professional soccer coach analyzing biomechanical data.

Drill: {submission.drill_type}
Ideal ranges for this drill: {json.dumps(context, indent=2)}
Player metrics: {json.dumps(metrics, indent=2)}

Compare the player metrics against the ideal ranges.
Be specific — reference actual numbers from the metrics in your feedback.
Provide structured feedback as JSON with these exact keys:
- overall_score: integer 0-100 based on how close metrics are to ideal ranges
- strengths: list of 2-3 specific observations that reference metric values
- weaknesses: list of 2-3 specific corrections that reference ideal ranges
- drill_plan: list of 3 weekly drills that directly target the weaknesses

Respond with valid JSON only. No markdown, no explanation, just the JSON object."""

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

            await analysis_repo.create(
                submission_id=submission_id,
                metrics=metrics,
                feedback=feedback,
                score=feedback.get("overall_score", 0)
            )

            await submission_repo.update_status(
                submission_id, SubmissionStatus.completed
            )
            await db.commit()

        except Exception as e:
            await submission_repo.update_status(
                submission_id, SubmissionStatus.failed
            )
            await db.commit()
            raise