"""
Utility functions for pose analysis and detection
"""

import numpy as np
import math
from typing import Tuple, List, Optional
import config


def calculate_distance(point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points"""
    return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)


def calculate_angle(point1: Tuple[float, float], point2: Tuple[float, float],
                   point3: Tuple[float, float]) -> float:
    """
    Calculate angle at point2 formed by point1-point2-point3
    Returns angle in degrees
    """
    # Vector from point2 to point1
    v1 = (point1[0] - point2[0], point1[1] - point2[1])
    # Vector from point2 to point3
    v2 = (point3[0] - point2[0], point3[1] - point2[1])

    # Calculate dot product and magnitudes
    dot_product = v1[0] * v2[0] + v1[1] * v2[1]
    magnitude1 = math.sqrt(v1[0]**2 + v1[1]**2)
    magnitude2 = math.sqrt(v2[0]**2 + v2[1]**2)

    if magnitude1 == 0 or magnitude2 == 0:
        return 0

    # Calculate angle in radians then convert to degrees
    cos_angle = dot_product / (magnitude1 * magnitude2)
    cos_angle = max(-1, min(1, cos_angle))  # Clamp to [-1, 1]
    angle_rad = math.acos(cos_angle)
    return math.degrees(angle_rad)


def is_keypoint_visible(keypoint: List[float], confidence_threshold: float = 0.3) -> bool:
    """Check if a keypoint is visible and confident enough"""
    if keypoint is None:
        return False

    # Handle both list and numpy array inputs
    if hasattr(keypoint, '__len__') and len(keypoint) >= 3:
        confidence = float(keypoint[2])
        return confidence > confidence_threshold
    return False


def extract_keypoints(pose_data: np.ndarray) -> dict:
    """
    Extract keypoints from YOLO pose detection results
    Returns dictionary with keypoint names and coordinates
    """
    keypoints = {}

    if pose_data is None or len(pose_data) == 0:
        return keypoints

    # Flatten the pose data if it's 2D
    if len(pose_data.shape) > 1:
        pose_data = pose_data.flatten()

    # YOLO pose returns 17 keypoints with (x, y, confidence)
    for name, idx in config.KEYPOINTS.items():
        if idx * 3 + 2 < len(pose_data):
            x = float(pose_data[idx * 3])
            y = float(pose_data[idx * 3 + 1])
            conf = float(pose_data[idx * 3 + 2])
            keypoints[name] = [x, y, conf]
        else:
            keypoints[name] = [0.0, 0.0, 0.0]

    return keypoints


def is_person_standing(keypoints: dict) -> bool:
    """
    Determine if a person is standing based on keypoint positions
    """
    # Check if key points are visible
    required_points = ['left_hip', 'right_hip', 'left_knee', 'right_knee',
                      'left_ankle', 'right_ankle', 'nose']

    for point in required_points:
        if not is_keypoint_visible(keypoints.get(point, [0.0, 0.0, 0.0])):
            return False

    try:
        # Calculate body height (from nose to average ankle position)
        nose_y = float(keypoints['nose'][1])
        left_ankle_y = float(keypoints['left_ankle'][1])
        right_ankle_y = float(keypoints['right_ankle'][1])
        avg_ankle_y = (left_ankle_y + right_ankle_y) / 2

        body_height = abs(avg_ankle_y - nose_y)

        # Calculate hip to knee distance
        left_hip_y = float(keypoints['left_hip'][1])
        right_hip_y = float(keypoints['right_hip'][1])
        left_knee_y = float(keypoints['left_knee'][1])
        right_knee_y = float(keypoints['right_knee'][1])

        avg_hip_y = (left_hip_y + right_hip_y) / 2
        avg_knee_y = (left_knee_y + right_knee_y) / 2

        thigh_length = abs(avg_knee_y - avg_hip_y)

        # Check if legs are relatively straight (standing position)
        if body_height > 0:
            leg_straightness_ratio = thigh_length / body_height
            return leg_straightness_ratio > config.STANDING_HEIGHT_RATIO
    except (KeyError, IndexError, TypeError, ValueError):
        return False

    return False


def are_elbows_above_shoulders_and_hands_above_elbows(keypoints: dict) -> bool:
    """
    Determine if elbows are above shoulders AND hands are above elbows
    Now detects if EITHER arm meets the conditions (left OR right)
    """
    try:
        # Check left arm conditions
        left_arm_valid = True
        left_points = ['left_shoulder', 'left_elbow', 'left_wrist']
        for point in left_points:
            if not is_keypoint_visible(keypoints.get(point, [0.0, 0.0, 0.0])):
                left_arm_valid = False
                break

        left_arm_meets_conditions = False
        if left_arm_valid:
            left_shoulder = keypoints['left_shoulder']
            left_elbow = keypoints['left_elbow']
            left_wrist = keypoints['left_wrist']

            left_elbow_above_shoulder = float(left_elbow[1]) < float(left_shoulder[1]) - config.ELBOW_SHOULDER_THRESHOLD
            left_hand_above_elbow = float(left_wrist[1]) < float(left_elbow[1]) - config.HAND_ELBOW_THRESHOLD

            left_arm_meets_conditions = left_elbow_above_shoulder and left_hand_above_elbow

        # Check right arm conditions
        right_arm_valid = True
        right_points = ['right_shoulder', 'right_elbow', 'right_wrist']
        for point in right_points:
            if not is_keypoint_visible(keypoints.get(point, [0.0, 0.0, 0.0])):
                right_arm_valid = False
                break

        right_arm_meets_conditions = False
        if right_arm_valid:
            right_shoulder = keypoints['right_shoulder']
            right_elbow = keypoints['right_elbow']
            right_wrist = keypoints['right_wrist']

            right_elbow_above_shoulder = float(right_elbow[1]) < float(right_shoulder[1]) - config.ELBOW_SHOULDER_THRESHOLD
            right_hand_above_elbow = float(right_wrist[1]) < float(right_elbow[1]) - config.HAND_ELBOW_THRESHOLD

            right_arm_meets_conditions = right_elbow_above_shoulder and right_hand_above_elbow

        # Return True if EITHER arm meets the conditions
        return left_arm_meets_conditions or right_arm_meets_conditions

    except (KeyError, IndexError, TypeError, ValueError):
        return False


def are_arms_raised(keypoints: dict) -> bool:
    """
    Determine if both arms are raised above the head
    DEPRECATED: Use are_elbows_above_shoulders_and_hands_above_elbows instead
    """
    # For backward compatibility, redirect to new function
    return are_elbows_above_shoulders_and_hands_above_elbows(keypoints)


def analyze_pose(keypoints: dict) -> dict:
    """
    Analyze pose and return detection results
    Focus on upper body pose: elbows above shoulders and hands above elbows
    """
    # Check the new target pose (elbows above shoulders and hands above elbows)
    target_pose = are_elbows_above_shoulders_and_hands_above_elbows(keypoints)

    # Keep arms_raised for backward compatibility (now same as target_pose)
    arms_raised = target_pose

    # Standing is no longer required for our target pose
    standing = is_person_standing(keypoints)

    return {
        'standing': standing,
        'arms_raised': arms_raised,
        'target_pose_detected': target_pose,
        'elbows_above_shoulders_and_hands_above_elbows': target_pose,
        'keypoints': keypoints
    }