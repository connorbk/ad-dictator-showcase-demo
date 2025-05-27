# 🤸‍♂️ Real-time Pose Detection System

This system provides real-time pose detection by sending webcam frames every **1.1 seconds exactly** to a Python YOLO pose detection API.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js Server │    │  Python Flask   │
│                 │◄──►│                 │◄──►│   Pose API      │
│ - Webcam capture│    │ - Socket.IO     │    │ - YOLO model    │
│ - UI components │    │ - Frame timing  │    │ - Pose analysis │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ad-dictator-showcase-demo
npm install
```

### 2. Start Python Pose Detection API

```bash
cd motionDetection
python pose_api.py
```

The Python API will start on `http://localhost:5110`

### 3. Start Node.js Pose Detection Server

```bash
npm run pose-server
```

The Node.js server will start on `http://localhost:3000`

### 4. Test the System

Open your browser and go to:
- **Standalone Demo**: `http://localhost:3000` 
- **React Integration**: Start the main React app with `npm run dev`

## ⚙️ Configuration

### Frame Timing
The system is configured to capture frames every **1.1 seconds exactly**:

```javascript
const FRAME_INTERVAL_MS = 1100; // Exactly 1.1 seconds
```

### Python API Settings
Configure pose detection in `motionDetection/config.py`:

```python
YOLO_MODEL = "yolov8n-pose.pt"  # Model type
INPUT_SIZE = 640                # Input image size
PERSON_CONFIDENCE_THRESHOLD = 0.5
POSE_CONFIDENCE_THRESHOLD = 0.5
```

## 🎯 Target Pose Detection

The system detects when a person raises both hands above their head:

1. **Elbows above shoulders** - First checkpoint
2. **Hands above elbows** - Second checkpoint  
3. **Both conditions met** - Target pose detected! ✅

## 📡 API Endpoints

### Node.js Server (Port 3000)
- `GET /` - Standalone demo page
- `GET /health` - Server health check
- `WebSocket` - Real-time pose detection communication

### Python Flask API (Port 5110)
- `POST /detect` - Pose detection endpoint
- `GET /health` - API health check
- `GET /config` - Current configuration

## 🔧 Development

### Start Development Servers

```bash
# Terminal 1: Python API
cd motionDetection
python pose_api.py

# Terminal 2: Node.js server with auto-reload
npm run pose-server:dev

# Terminal 3: React development server
npm run dev
```

### File Structure

```
ad-dictator-showcase-demo/
├── pose-detection-server.js          # Node.js Socket.IO server
├── public/
│   └── pose-detection.html           # Standalone demo page
├── src/components/
│   └── PoseDetectionDemo.tsx         # React component
├── motionDetection/
│   ├── pose_api.py                   # Python Flask API
│   ├── pose_detector.py              # YOLO pose detection
│   ├── config.py                     # Configuration
│   └── requirements.txt              # Python dependencies
└── package.json                      # Node.js dependencies
```

## 🎮 Usage Examples

### Standalone Demo
```bash
npm run pose-server
# Open http://localhost:3000
```

### React Component Integration
```tsx
import PoseDetectionDemo from '@/components/PoseDetectionDemo';

function MyApp() {
  return (
    <PoseDetectionDemo
      autoStart={true}
      timeoutDuration={30000}
      onSuccess={() => console.log('Pose detected!')}
      onTimeout={() => console.log('Detection timeout')}
    />
  );
}
```

## 📊 Real-time Data

The system provides real-time feedback:

- **Frame Count**: Total frames processed
- **Pose Count**: Successful pose detections
- **Processing Time**: Average API response time
- **Connection Status**: Server connectivity

## 🔍 Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Allow camera permissions in browser
   - Use HTTPS for production deployment

2. **Python API Not Responding**
   - Check if Flask server is running on port 5110
   - Verify Python dependencies are installed

3. **Socket Connection Failed**
   - Ensure Node.js server is running on port 3000
   - Check firewall settings

### Debug Mode

Enable debug logging:

```bash
DEBUG=true npm run pose-server
```

## 🎯 Performance Optimization

### Frame Capture Settings
- **Quality**: 0.8 (80% JPEG quality)
- **Resolution**: 640x480 (optimal for YOLO)
- **Interval**: 1100ms (exactly 1.1 seconds)

### YOLO Model Options
Choose model based on speed vs accuracy needs:

- `yolov8n-pose.pt` - Fastest (recommended)
- `yolov8s-pose.pt` - Balanced
- `yolov8m-pose.pt` - More accurate
- `yolov8l-pose.pt` - High accuracy
- `yolov8x-pose.pt` - Highest accuracy

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000                    # Node.js server port
FLASK_API_URL=http://localhost:5110  # Python API URL
DEBUG=false                  # Disable debug mode
```

### Docker Support
```dockerfile
# Example Dockerfile for Node.js server
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "pose-server"]
```

## 📝 License

This pose detection system is part of the Ad Dictator Showcase Demo project.
