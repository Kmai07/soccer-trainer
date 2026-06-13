import cv2
from pathlib import Path

def extract_frames(video_path: str, sample_rate: int = 10) -> list:
    """
    Extract frames from a video file.
    sample_rate: extract every Nth frame (10 = ~3fps from 30fps video)
    Returns a list of frames as numpy arrays.
    """
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
    """Returns video duration in seconds."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    if fps == 0:
        return 0.0
    return frame_count / fps