# Motion Detection Integration Guide

This guide explains how to integrate and use the motion detection system in your Ad Dictator showcase app.

## System Architecture

The motion detection system consists of three components:

1. **Python Flask API** (port 5110) - YOLO-based pose detection using YOLOv8
2. **Node.js Socket.IO Bridge** (port 3000) - Bridges React app and Python API
3. **React Frontend** - PoseDetectionDemo component with real-time video processing

## Quick Start

### 1. Setup (One-time)

First, ensure the Python environment is set up:

```bash
# Run the setup script
npm run setup-pose

# Or manually:
cd motionDetection
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Start Motion Detection System

**Option A: Automated (Recommended)**
```bash
# Windows
npm run start-motion-detection:windows

# Linux/Mac
npm run start-motion-detection
```

**Option B: Manual**
```bash
# Terminal 1: Start Flask API
npm run flask-api

# Terminal 2: Start Socket.IO Bridge
npm run pose-server

# Terminal 3: Start React App
npm run dev
```

### 3. Test the System

1. Open your React app (usually http://localhost:8080)
2. Navigate to the Demo Section
3. Click on "Pose Detection" demo
4. Allow camera access
5. Raise both hands above your head to trigger detection

## How It Works

### Detection Flow

1. **Frame Capture**: React app captures video frames every 1.1 seconds
2. **Socket.IO**: Frames sent to Node.js bridge server via WebSocket
3. **Flask API**: Python server processes frames using YOLOv8 pose detection
4. **Results**: Pose analysis results sent back to React app
5. **Success**: Target pose (hands raised) triggers success callback

### Target Pose Detection

The system detects when a person:
- Has both elbows above shoulders
- Has both hands above elbows
- Maintains pose for sufficient confidence

## Configuration

### Python API Configuration (motionDetection/config.py)

```python
# Model settings
YOLO_MODEL = "yolov8n-pose.pt"  # Fastest model
PERSON_CONFIDENCE_THRESHOLD = 0.4
POSE_CONFIDENCE_THRESHOLD = 0.25

# Pose detection thresholds
ELBOW_SHOULDER_THRESHOLD = 15  # pixels
HAND_ELBOW_THRESHOLD = 15      # pixels
```

### Socket.IO Configuration (pose-detection-server.js)

```javascript
const FRAME_INTERVAL_MS = 1100; // 1.1 seconds between frames
const FLASK_API_URL = 'http://localhost:5110';
```

### React Component Configuration

```typescript
// In PoseDetectionDemo component
serverUrl = 'http://localhost:3000'  // Socket.IO bridge
timeoutDuration = 30000              // 30 second timeout
```

## Troubleshooting

### Common Issues

1. **"Connection failed"**
   - Ensure Flask API is running on port 5110
   - Ensure Socket.IO bridge is running on port 3000
   - Check firewall settings

2. **"Camera access denied"**
   - Allow camera permissions in browser
   - Ensure no other apps are using the camera

3. **"Model not found"**
   - YOLOv8 will auto-download on first run
   - Ensure internet connection for model download

4. **Slow detection**
   - Reduce INPUT_SIZE in config.py for faster processing
   - Use yolov8n-pose.pt (nano) model for speed

### Debug Commands

```bash
# Check Flask API health
curl http://localhost:5110/health

# Check Socket.IO bridge
curl http://localhost:3000/health

# View Flask API configuration
curl http://localhost:5110/config
```

## Performance Optimization

### For Speed
- Use `yolov8n-pose.pt` (nano model)
- Reduce `INPUT_SIZE` to 416 or 320
- Lower confidence thresholds
- Increase frame interval

### For Accuracy
- Use `yolov8l-pose.pt` (large model)
- Increase `INPUT_SIZE` to 640+
- Higher confidence thresholds
- Decrease frame interval

## Integration with Demo System

The motion detection integrates with your existing demo system:

```typescript
// In DemoSection.tsx
{demoState === 'pose-detection' && (
  <PoseDetectionDemo
    onClose={() => setDemoState('idle')}
    onSuccess={() => setDemoState('success')}
    onTimeout={() => setDemoState('idle')}
    autoStart={true}
  />
)}
```

## API Endpoints

### Flask API (port 5110)
- `GET /` - API information
- `GET /health` - Health check
- `GET /config` - Current configuration
- `POST /detect` - Pose detection (accepts base64 image)

### Socket.IO Events
- `connect` - Client connection
- `start_pose_detection` - Begin frame capture
- `stop_pose_detection` - Stop frame capture
- `detect_pose` - Process single frame
- `pose_result` - Detection results
- `pose_error` - Error handling

## Next Steps

1. **Customize Detection**: Modify pose analysis logic in `motionDetection/utils.py`
2. **Add Gestures**: Extend detection to recognize specific gestures
3. **Improve UI**: Enhance the PoseDetectionDemo component
4. **Deploy**: Set up production deployment with proper process management
