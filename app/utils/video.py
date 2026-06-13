import cv2
import cloudinary
import cloudinary.uploader
from pathlib import Path
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

def upload_video(file_path: str) -> str:
    result = cloudinary.uploader.upload(
        file_path,
        resource_type="video",
        folder="soccer-trainer"
    )
    return result["secure_url"]

def download_video(url: str, dest_path: str) -> str:
    import urllib.request
    urllib.request.urlretrieve(url, dest_path)
    return dest_path

def extract_frames(video_path: str, sample_rate: int = 10) -> list:
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % sample_rate == 0:
            frames.append(frame)
        frame_count += 1
    cap.release()
    return frames

def get_video_duration(video_path: str) -> float:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    if fps == 0:
        return 0.0
    return frame_count / fps