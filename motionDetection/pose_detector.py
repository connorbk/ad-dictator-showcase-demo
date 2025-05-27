"""
YOLO-based pose detection system for detecting standing with raised arms
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from typing import Optional, Tuple, List
import config
import utils


class PoseDetector:
    def __init__(self, model_path: str = config.YOLO_MODEL, optimize_for_speed: bool = True):
        """
        Initialize the pose detector with YOLO model

        Args:
            model_path: Path to YOLO pose model
            optimize_for_speed: Whether to optimize for speed over accuracy
        """
        # Load YOLO model - handle PyTorch security changes
        import torch
        import os

        # Check if model file exists, if not YOLO will download it
        if not os.path.exists(model_path):
            print(f"Model {model_path} not found, YOLO will download it...")

        # Temporarily set torch.load to use weights_only=False for YOLO models
        original_load = torch.load
        def patched_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)

        try:
            torch.load = patched_load
            self.model = YOLO(model_path)
            print(f"✓ Successfully loaded YOLO model: {model_path}")
        except Exception as e:
            print(f"Error loading model {model_path}: {e}")
            raise
        finally:
            # Restore original torch.load
            torch.load = original_load
        self.consecutive_detections = 0
        self.last_alert_time = 0
        self.detection_history = []
        self.optimize_for_speed = optimize_for_speed

        # Performance optimizations
        if optimize_for_speed:
            # Set model to evaluation mode for faster inference
            self.model.model.eval()

            # Try to use half precision if available (faster on modern GPUs)
            try:
                self.model.model.half()
                self.use_half = True
                print("✓ Using half precision for faster inference")
            except:
                self.use_half = False
                print("! Half precision not available, using full precision")

    def detect_poses(self, frame: np.ndarray) -> List[dict]:
        """
        Detect poses in a frame using YOLO predict method

        Args:
            frame: Input image frame

        Returns:
            List of pose analysis results
        """
        # Resize frame for faster processing if optimization is enabled
        original_frame = frame
        if self.optimize_for_speed and config.INPUT_SIZE < frame.shape[1]:
            # Calculate new dimensions maintaining aspect ratio
            height, width = frame.shape[:2]
            scale = config.INPUT_SIZE / max(width, height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height))

        # Run YOLO inference using predict method with speed optimizations
        predict_params = {
            'conf': config.PERSON_CONFIDENCE_THRESHOLD,
            'verbose': False,
            'save': False,
            'show': False,
            'imgsz': config.INPUT_SIZE if self.optimize_for_speed else 640,
        }

        # Add half precision if available
        if self.optimize_for_speed and hasattr(self, 'use_half') and self.use_half:
            predict_params['half'] = True

        results = self.model.predict(frame, **predict_params)

        pose_results = []

        # Calculate scale factor for keypoint adjustment if frame was resized
        scale_x = scale_y = 1.0
        if self.optimize_for_speed and config.INPUT_SIZE < original_frame.shape[1]:
            original_height, original_width = original_frame.shape[:2]
            current_height, current_width = frame.shape[:2]
            scale_x = original_width / current_width
            scale_y = original_height / current_height

        for result in results:
            if result.keypoints is not None and len(result.keypoints.data) > 0:
                # Process each detected person
                for i, keypoints_data in enumerate(result.keypoints.data):
                    # Extract keypoints
                    keypoints_array = keypoints_data.cpu().numpy()

                    # Scale keypoints back to original frame size if needed
                    if scale_x != 1.0 or scale_y != 1.0:
                        # Scale x and y coordinates, keep confidence unchanged
                        for j in range(0, len(keypoints_array), 3):
                            if j + 1 < len(keypoints_array):
                                keypoints_array[j] *= scale_x      # x coordinate
                                keypoints_array[j + 1] *= scale_y  # y coordinate
                                # keypoints_array[j + 2] remains unchanged (confidence)

                    keypoints = utils.extract_keypoints(keypoints_array)

                    # Analyze pose
                    analysis = utils.analyze_pose(keypoints)

                    # Add bounding box info if available
                    if result.boxes is not None and i < len(result.boxes):
                        box = result.boxes[i]
                        bbox = box.xyxy[0].cpu().numpy()

                        # Scale bounding box back to original size if needed
                        if scale_x != 1.0 or scale_y != 1.0:
                            bbox[0] *= scale_x  # x1
                            bbox[1] *= scale_y  # y1
                            bbox[2] *= scale_x  # x2
                            bbox[3] *= scale_y  # y2

                        analysis['bbox'] = bbox
                        analysis['confidence'] = float(box.conf[0].cpu().numpy())

                        # Add person ID for tracking (if available)
                        if hasattr(box, 'id') and box.id is not None:
                            analysis['person_id'] = int(box.id[0].cpu().numpy())
                        else:
                            analysis['person_id'] = i
                    else:
                        analysis['person_id'] = i
                        analysis['confidence'] = 0.5

                    # Add raw keypoints for advanced visualization
                    analysis['raw_keypoints'] = keypoints_array

                    pose_results.append(analysis)

        return pose_results

    def update_detection_state(self, pose_results: List[dict]) -> bool:
        """
        Update detection state and check for target pose

        Args:
            pose_results: List of pose analysis results

        Returns:
            True if target pose is detected consistently
        """
        target_detected = any(result['target_pose_detected'] for result in pose_results)

        if target_detected:
            self.consecutive_detections += 1
        else:
            self.consecutive_detections = 0

        # Add to history (keep last 10 frames)
        self.detection_history.append(target_detected)
        if len(self.detection_history) > 10:
            self.detection_history.pop(0)

        # Check if we have enough consecutive detections
        return self.consecutive_detections >= config.CONSECUTIVE_FRAMES_THRESHOLD

    def should_show_alert(self) -> bool:
        """Check if alert should be shown based on timing"""
        current_time = time.time()
        return current_time - self.last_alert_time > config.ALERT_DURATION

    def trigger_alert(self):
        """Trigger alert and update timing"""
        self.last_alert_time = time.time()
        print("🚨 TARGET POSE DETECTED: One arm with elbow above shoulder and hand above elbow! 🚨")

    def draw_pose(self, frame: np.ndarray, pose_result: dict) -> np.ndarray:
        """
        Draw enhanced pose keypoints and skeleton on frame with tracking

        Args:
            frame: Input frame
            pose_result: Pose analysis result

        Returns:
            Frame with pose visualization
        """
        keypoints = pose_result['keypoints']

        # Define skeleton connections - focus only on arms (shoulders, elbows, hands)
        skeleton_connections = {
            'left_arm': [('left_shoulder', 'left_elbow'), ('left_elbow', 'left_wrist')],
            'right_arm': [('right_shoulder', 'right_elbow'), ('right_elbow', 'right_wrist')],
            'shoulders': [('left_shoulder', 'right_shoulder')]  # Connection between shoulders
        }

        # Choose colors based on pose detection and body parts
        if pose_result['target_pose_detected']:
            base_color = config.COLORS['green']
            arm_color = (0, 255, 0)  # Bright green for raised arms
        elif pose_result['standing']:
            base_color = config.COLORS['yellow']
            arm_color = (0, 255, 255)  # Yellow
        else:
            base_color = config.COLORS['blue']
            arm_color = (255, 0, 0)  # Blue

        # Special highlighting for arms if raised
        if pose_result['arms_raised']:
            arm_color = (0, 255, 0)  # Bright green for raised arms

        # Draw bounding box if available
        if 'bbox' in pose_result:
            bbox = pose_result['bbox']
            x1, y1, x2, y2 = map(int, bbox)

            # Choose bbox color based on detection
            bbox_color = base_color
            thickness = 3 if pose_result['target_pose_detected'] else 2

            cv2.rectangle(frame, (x1, y1), (x2, y2), bbox_color, thickness)

            # Draw person ID and confidence
            person_id = pose_result.get('person_id', 0)
            confidence = pose_result.get('confidence', 0.0)
            label = f"Person {person_id}: {confidence:.2f}"

            # Label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(frame, (x1, y1 - 25), (x1 + label_size[0], y1), bbox_color, -1)
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                       config.COLORS['white'], 2)

        # Draw skeleton with different colors for different body parts
        for part_name, connections in skeleton_connections.items():
            if part_name in ['left_arm', 'right_arm']:
                color = arm_color
                thickness = config.LINE_THICKNESS + 2 if pose_result['target_pose_detected'] else config.LINE_THICKNESS + 1
            elif part_name == 'shoulders':
                color = (0, 255, 255)  # Cyan for shoulder connection
                thickness = config.LINE_THICKNESS + 1 if pose_result['target_pose_detected'] else config.LINE_THICKNESS
            else:
                color = base_color
                thickness = config.LINE_THICKNESS

            for connection in connections:
                point1_name, point2_name = connection
                point1 = keypoints.get(point1_name)
                point2 = keypoints.get(point2_name)

                if (point1 and point2 and
                    utils.is_keypoint_visible(point1) and
                    utils.is_keypoint_visible(point2)):

                    pt1 = (int(point1[0]), int(point1[1]))
                    pt2 = (int(point2[0]), int(point2[1]))
                    cv2.line(frame, pt1, pt2, color, thickness)

        # Draw only relevant keypoints (hands, elbows, shoulders)
        relevant_keypoints = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist']

        keypoint_colors = {
            'left_shoulder': (0, 255, 255), 'right_shoulder': (0, 255, 255),  # Cyan for shoulders
            'left_elbow': (255, 165, 0), 'right_elbow': (255, 165, 0),  # Orange for elbows
            'left_wrist': arm_color, 'right_wrist': arm_color,  # Arm color for wrists/hands
        }

        for name in relevant_keypoints:
            point = keypoints.get(name)
            if point and utils.is_keypoint_visible(point):
                center = (int(point[0]), int(point[1]))
                color = keypoint_colors.get(name, base_color)

                # Different sizes based on keypoint type and pose state
                if name in ['left_wrist', 'right_wrist']:
                    # Hands - largest when target pose is detected
                    radius = 10 if pose_result['target_pose_detected'] else 8
                elif name in ['left_elbow', 'right_elbow']:
                    # Elbows - medium size, larger when target pose detected
                    radius = 8 if pose_result['target_pose_detected'] else 6
                elif name in ['left_shoulder', 'right_shoulder']:
                    # Shoulders - reference points
                    radius = 7 if pose_result['target_pose_detected'] else 5
                else:
                    radius = 4

                cv2.circle(frame, center, radius, color, -1)
                cv2.circle(frame, center, radius + 1, (255, 255, 255), 2)  # White outline

                # Add labels for clarity
                if pose_result['target_pose_detected']:
                    label_map = {
                        'left_wrist': 'LH', 'right_wrist': 'RH',  # LH = Left Hand, RH = Right Hand
                        'left_elbow': 'LE', 'right_elbow': 'RE',  # LE = Left Elbow, RE = Right Elbow
                        'left_shoulder': 'LS', 'right_shoulder': 'RS'  # LS = Left Shoulder, RS = Right Shoulder
                    }
                    label = label_map.get(name, '')
                    if label:
                        cv2.putText(frame, label, (center[0] - 10, center[1] - 15),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        # Draw pose status text near the person
        if 'bbox' in pose_result:
            bbox = pose_result['bbox']
            x1, y1, x2, y2 = map(int, bbox)

            status_texts = []
            if pose_result.get('elbows_above_shoulders_and_hands_above_elbows', False):
                status_texts.append("ELBOWS UP & HANDS UP")
            if pose_result['target_pose_detected']:
                status_texts.append("TARGET POSE DETECTED!")

            # Draw status text
            for i, text in enumerate(status_texts):
                y_offset = y2 + 20 + (i * 25)
                text_color = (0, 255, 0) if pose_result['target_pose_detected'] else (255, 255, 255)
                cv2.putText(frame, text, (x1, y_offset), cv2.FONT_HERSHEY_SIMPLEX,
                           0.7, text_color, 2)

        return frame

    def draw_poses(self, frame: np.ndarray, pose_results: List[dict]) -> np.ndarray:
        """
        Draw multiple poses on frame

        Args:
            frame: Input frame
            pose_results: List of pose analysis results

        Returns:
            Frame with all poses visualized
        """
        result_frame = frame.copy()

        # Draw each pose on the frame
        for pose_result in pose_results:
            result_frame = self.draw_pose(result_frame, pose_result)

        return result_frame

    def draw_status(self, frame: np.ndarray, pose_results: List[dict],
                   alert_active: bool) -> np.ndarray:
        """
        Draw status information on frame

        Args:
            frame: Input frame
            pose_results: List of pose analysis results
            alert_active: Whether alert is currently active

        Returns:
            Frame with status information
        """
        height, width = frame.shape[:2]

        # Status text
        status_lines = [
            f"People detected: {len(pose_results)}",
            f"Consecutive detections: {self.consecutive_detections}",
        ]

        # Add individual status for each person
        for i, result in enumerate(pose_results):
            pose_status = "Elbows up & hands up" if result.get('elbows_above_shoulders_and_hands_above_elbows', False) else "Normal pose"
            target = "TARGET POSE!" if result['target_pose_detected'] else ""
            status_lines.append(f"Person {i+1}: {pose_status} {target}")

        # Draw status background
        status_height = len(status_lines) * 30 + 20
        cv2.rectangle(frame, (10, 10), (400, status_height), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (400, status_height), config.COLORS['white'], 2)

        # Draw status text
        for i, line in enumerate(status_lines):
            y_pos = 35 + i * 25
            cv2.putText(frame, line, (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX,
                       0.6, config.COLORS['white'], 1)

        # Draw alert if active
        if alert_active:
            alert_text = "🚨 TARGET POSE DETECTED! 🚨"
            text_size = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX,
                                      config.FONT_SCALE, config.FONT_THICKNESS)[0]
            text_x = (width - text_size[0]) // 2
            text_y = height - 50

            # Alert background
            cv2.rectangle(frame, (text_x - 10, text_y - 30),
                         (text_x + text_size[0] + 10, text_y + 10),
                         config.COLORS['red'], -1)

            # Alert text
            cv2.putText(frame, alert_text, (text_x, text_y),
                       cv2.FONT_HERSHEY_SIMPLEX, config.FONT_SCALE,
                       config.COLORS['white'], config.FONT_THICKNESS)

        return frame