#!/usr/bin/env python3
"""
Flask API for YOLO pose detection
Accepts image data and returns pose detection results
"""

import os
import base64
import json
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
from datetime import datetime
from pose_detector import PoseDetector
import config
import io
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global detector instance
detector = None

def get_detector():
    """Get or initialize the pose detector"""
    global detector
    if detector is None:
        print("Loading YOLO model...")
        detector = PoseDetector(config.YOLO_MODEL, optimize_for_speed=True)
        print("Model loaded successfully!")
    return detector

def decode_image(image_data):
    """Decode base64 image data to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # Decode base64
        img_data = base64.b64decode(image_data)

        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(img_data))
        
        # Convert PIL to OpenCV format
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        return opencv_image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def encode_image(image):
    """Encode OpenCV image to base64"""
    try:
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(rgb_image)
        
        # Save to bytes
        img_buffer = io.BytesIO()
        pil_image.save(img_buffer, format='JPEG', quality=85)
        img_buffer.seek(0)
        
        # Encode to base64
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

@app.route('/')
def index():
    """API info endpoint"""
    return jsonify({
        'name': 'YOLO Pose Detection API',
        'version': '1.0.0',
        'endpoints': {
            '/detect': 'POST - Detect poses in image',
            '/health': 'GET - Health check',
            '/config': 'GET - Get current configuration'
        }
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/config')
def get_config():
    """Get current configuration"""
    return jsonify({
        'model': config.YOLO_MODEL,
        'input_size': config.INPUT_SIZE,
        'person_confidence_threshold': config.PERSON_CONFIDENCE_THRESHOLD,
        'pose_confidence_threshold': config.POSE_CONFIDENCE_THRESHOLD,
        'elbow_shoulder_threshold': config.ELBOW_SHOULDER_THRESHOLD,
        'hand_elbow_threshold': config.HAND_ELBOW_THRESHOLD,
        'keypoints': config.KEYPOINTS
    })

@app.route('/detect', methods=['POST'])
def detect_poses():
    """
    Detect poses in uploaded image
    
    Expected JSON payload:
    {
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "return_image": true,  // optional, default false
        "draw_keypoints": true  // optional, default false
    }
    """
    try:
        start_time = time.time()
        
        # Get JSON data
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        # Decode image
        image = decode_image(data['image'])
        if image is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        # Get options
        return_image = data.get('return_image', False)
        draw_keypoints = data.get('draw_keypoints', False)

        # Get detector
        pose_detector = get_detector()

        # Detect poses
        pose_results = pose_detector.detect_poses(image)

        # Prepare response
        response = {
            'success': True,
            'processing_time_ms': (time.time() - start_time) * 1000,
            'people_detected': len(pose_results),
            'image_dimensions': {
                'width': image.shape[1],
                'height': image.shape[0]
            },
            'detections': []
        }

        # Process each detection
        for i, result in enumerate(pose_results):
            detection = {
                'person_id': i + 1,
                'confidence': result.get('confidence', 0.0),
                'target_pose_detected': result['target_pose_detected'],
                'pose_analysis': {
                    'elbows_above_shoulders': result.get('elbows_above_shoulders', False),
                    'hands_above_elbows': result.get('hands_above_elbows', False),
                    'elbows_above_shoulders_and_hands_above_elbows': result.get('elbows_above_shoulders_and_hands_above_elbows', False)
                },
                'keypoints': {}
            }

            # Add keypoints with confidence scores
            keypoints = result['keypoints']
            for point_name, coords in keypoints.items():
                if len(coords) >= 3:  # x, y, confidence
                    detection['keypoints'][point_name] = {
                        'x': float(coords[0]),
                        'y': float(coords[1]),
                        'confidence': float(coords[2]),
                        'visible': float(coords[2]) > config.POSE_CONFIDENCE_THRESHOLD
                    }

            # Add bounding box if available
            if 'bbox' in result:
                bbox = result['bbox']
                detection['bbox'] = {
                    'x1': float(bbox[0]),
                    'y1': float(bbox[1]),
                    'x2': float(bbox[2]),
                    'y2': float(bbox[3]),
                    'width': float(bbox[2] - bbox[0]),
                    'height': float(bbox[3] - bbox[1])
                }

            response['detections'].append(detection)

        # Add processed image if requested
        if return_image:
            processed_image = image.copy()
            
            if draw_keypoints:
                # Draw keypoints and connections on image
                processed_image = pose_detector.draw_poses(processed_image, pose_results)
            
            # Encode processed image
            encoded_image = encode_image(processed_image)
            if encoded_image:
                response['processed_image'] = encoded_image

        return jsonify(response)

    except Exception as e:
        print(f"Error in pose detection: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'processing_time_ms': (time.time() - start_time) * 1000 if 'start_time' in locals() else 0
        }), 500

@app.route('/detect_batch', methods=['POST'])
def detect_poses_batch():
    """
    Detect poses in multiple images
    
    Expected JSON payload:
    {
        "images": [
            "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
            "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
        ],
        "return_images": false,
        "draw_keypoints": false
    }
    """
    try:
        start_time = time.time()
        
        data = request.get_json()
        if not data or 'images' not in data:
            return jsonify({'error': 'No images data provided'}), 400

        images_data = data['images']
        if not isinstance(images_data, list) or len(images_data) == 0:
            return jsonify({'error': 'Images must be a non-empty list'}), 400

        return_images = data.get('return_images', False)
        draw_keypoints = data.get('draw_keypoints', False)

        # Get detector
        pose_detector = get_detector()

        results = []
        
        for idx, image_data in enumerate(images_data):
            try:
                # Decode image
                image = decode_image(image_data)
                if image is None:
                    results.append({
                        'image_index': idx,
                        'success': False,
                        'error': 'Failed to decode image'
                    })
                    continue

                # Detect poses
                pose_results = pose_detector.detect_poses(image)

                # Prepare result for this image
                result = {
                    'image_index': idx,
                    'success': True,
                    'people_detected': len(pose_results),
                    'detections': []
                }

                # Process detections (simplified for batch processing)
                for i, pose_result in enumerate(pose_results):
                    detection = {
                        'person_id': i + 1,
                        'confidence': pose_result.get('confidence', 0.0),
                        'target_pose_detected': pose_result['target_pose_detected']
                    }
                    result['detections'].append(detection)

                # Add processed image if requested
                if return_images:
                    processed_image = image.copy()
                    if draw_keypoints:
                        processed_image = pose_detector.draw_poses(processed_image, pose_results)
                    
                    encoded_image = encode_image(processed_image)
                    if encoded_image:
                        result['processed_image'] = encoded_image

                results.append(result)

            except Exception as e:
                results.append({
                    'image_index': idx,
                    'success': False,
                    'error': str(e)
                })

        return jsonify({
            'success': True,
            'processing_time_ms': (time.time() - start_time) * 1000,
            'total_images': len(images_data),
            'results': results
        })

    except Exception as e:
        print(f"Error in batch pose detection: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'processing_time_ms': (time.time() - start_time) * 1000 if 'start_time' in locals() else 0
        }), 500

if __name__ == '__main__':
    # Initialize detector on startup
    print("Initializing YOLO pose detection API...")
    get_detector()
    print("API ready!")

    # Run the app
    port = int(5110)
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Flask API on port {port}")
    print(f"API endpoints available at:")
    print(f"  http://localhost:{port}/")
    print(f"  http://localhost:{port}/detect")
    print(f"  http://localhost:{port}/health")
    print(f"  http://localhost:{port}/config")
    
    app.run(host='0.0.0.0', port=port, debug=debug)