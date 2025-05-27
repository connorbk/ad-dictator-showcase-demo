"""
Configuration file for YOLO pose detection system
"""

# YOLO Model Configuration
YOLO_MODEL = "yolov8n-pose.pt"  # YOLOv8 nano pose model (fastest)

# Model options (from fastest to most accurate):
MODEL_OPTIONS = {
    'nano': "yolov8n-pose.pt",      # Fastest, least accurate
    'small': "yolov8s-pose.pt",     # Fast, good balance
    'medium': "yolov8m-pose.pt",    # Medium speed, good accuracy
    'large': "yolov8l-pose.pt",     # Slower, high accuracy
    'xlarge': "yolov8x-pose.pt"     # Slowest, highest accuracy
}

# Performance optimizations for faster inference
OPTIMIZE_FOR_SPEED = True
INPUT_SIZE = 640  # Smaller input size for faster processing (default: 640)
# For even faster processing, try: 416, 320, or 224

# Detection Confidence Thresholds
PERSON_CONFIDENCE_THRESHOLD = 0.4  # Lowered for faster processing
POSE_CONFIDENCE_THRESHOLD = 0.25   # Lowered for faster processing

# Speed optimization thresholds (more aggressive for speed)
FAST_MODE_CONFIDENCE_THRESHOLD = 0.3
FAST_MODE_POSE_CONFIDENCE_THRESHOLD = 0.2

# Pose Analysis Parameters
STANDING_HEIGHT_RATIO = 0.6  # Minimum height ratio to be considered standing
ARM_RAISE_ANGLE_THRESHOLD = 45  # Degrees above horizontal for raised arms
ARM_RAISE_HEIGHT_RATIO = 0.8  # Arms must be above this ratio of body height

# New pose detection parameters for elbows above shoulders and hands above elbows
ELBOW_SHOULDER_THRESHOLD = 15  # Minimum pixels elbows must be above shoulders
HAND_ELBOW_THRESHOLD = 15      # Minimum pixels hands must be above elbows

# Keypoint indices for COCO pose format (17 keypoints)
KEYPOINTS = {
    'nose': 0,
    'left_eye': 1,
    'right_eye': 2,
    'left_ear': 3,
    'right_ear': 4,
    'left_shoulder': 5,
    'right_shoulder': 6,
    'left_elbow': 7,
    'right_elbow': 8,
    'left_wrist': 9,
    'right_wrist': 10,
    'left_hip': 11,
    'right_hip': 12,
    'left_knee': 13,
    'right_knee': 14,
    'left_ankle': 15,
    'right_ankle': 16
}

# Visual Display Settings
DISPLAY_WIDTH = 1280
DISPLAY_HEIGHT = 720
FONT_SCALE = 1.0
FONT_THICKNESS = 2
LINE_THICKNESS = 3

# Colors (BGR format for OpenCV)
COLORS = {
    'green': (0, 255, 0),
    'red': (0, 0, 255),
    'blue': (255, 0, 0),
    'yellow': (0, 255, 255),
    'white': (255, 255, 255),
    'black': (0, 0, 0)
}

# Alert Settings
ALERT_DURATION = 2.0  # seconds to show alert
CONSECUTIVE_FRAMES_THRESHOLD = 5  # frames needed to confirm pose