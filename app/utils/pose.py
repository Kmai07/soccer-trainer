import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions
from mediapipe.tasks.python.vision.core.vision_task_running_mode import VisionTaskRunningMode
import urllib.request
from pathlib import Path

MODEL_PATH = Path("pose_landmarker.task")

def download_model():
    if not MODEL_PATH.exists():
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        urllib.request.urlretrieve(url, MODEL_PATH)

def extract_pose_landmarks(frames: list) -> list[dict]:
    download_model()
    landmarks_per_frame = []

    base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
    options = PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=VisionTaskRunningMode.IMAGE
    )

    with PoseLandmarker.create_from_options(options) as landmarker:
        for frame in frames:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            results = landmarker.detect(mp_image)

            if results.pose_landmarks:
                landmarks = {}
                for idx, landmark in enumerate(results.pose_landmarks[0]):
                    landmarks[idx] = {
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    }
                landmarks_per_frame.append(landmarks)

    return landmarks_per_frame


def compute_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0))))


def compute_metrics(landmarks_per_frame: list[dict]) -> dict:
    if not landmarks_per_frame:
        return {}

    knee_angles = []
    hip_angles = []
    body_leans = []
    ankle_y_positions = []

    for landmarks in landmarks_per_frame:
        if all(k in landmarks for k in [23, 25, 27]):
            hip = np.array([landmarks[23]["x"], landmarks[23]["y"]])
            knee = np.array([landmarks[25]["x"], landmarks[25]["y"]])
            ankle = np.array([landmarks[27]["x"], landmarks[27]["y"]])
            knee_angles.append(compute_angle(hip, knee, ankle))

        if all(k in landmarks for k in [11, 23, 25]):
            shoulder = np.array([landmarks[11]["x"], landmarks[11]["y"]])
            hip = np.array([landmarks[23]["x"], landmarks[23]["y"]])
            knee = np.array([landmarks[25]["x"], landmarks[25]["y"]])
            hip_angles.append(compute_angle(shoulder, hip, knee))

        if all(k in landmarks for k in [11, 23]):
            lean = abs(landmarks[11]["x"] - landmarks[23]["x"])
            body_leans.append(lean)

        if 27 in landmarks:
            ankle_y_positions.append(landmarks[27]["y"])

    def safe_mean(lst): return float(np.mean(lst)) if lst else None
    def safe_min(lst):  return float(np.min(lst)) if lst else None
    def safe_std(lst):  return float(np.std(lst)) if lst else None

    return {
        "avg_knee_angle": safe_mean(knee_angles),
        "min_knee_angle": safe_min(knee_angles),
        "avg_hip_angle": safe_mean(hip_angles),
        "min_hip_angle": safe_min(hip_angles),
        "avg_body_lean": safe_mean(body_leans),
        "ankle_stability": safe_std(ankle_y_positions),
        "frame_count": len(landmarks_per_frame)
    }