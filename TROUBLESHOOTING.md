# Motion Detection Troubleshooting Guide

Based on the logs you provided, it looks like you're running a simplified version of the Socket.IO server. Here's how to fix it:

## Issue Analysis

The logs show a server that's missing the frame timing logic and specific event handlers that the PoseDetectionDemo component expects. The server needs to handle:
- `start_pose_detection` events
- `stop_pose_detection` events  
- `request_frame` events with timing
- Frame interval management

## Step-by-Step Fix

### 1. Stop Current Servers
First, stop any running servers:
```bash
# Press Ctrl+C in any terminals running servers
# Or close the command windows
```

### 2. Verify You Have the Correct Files
Make sure you have the complete `pose-detection-server.js` file:

```bash
# Check if the file exists and has the right content
ls -la pose-detection-server.js
```

The file should be about 199 lines and include frame timing logic.

### 3. Test Server Setup
Run our test script to verify everything is set up correctly:

```bash
npm run test-servers
```

This will check if all required servers can start properly.

### 4. Start Servers Manually (Recommended)

**Terminal 1 - Flask API:**
```bash
cd motionDetection
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

python pose_api.py
```

**Terminal 2 - Socket.IO Bridge:**
```bash
node pose-detection-server.js
```

**Terminal 3 - React App:**
```bash
npm run dev
```

### 5. Verify Each Server

**Check Flask API (Terminal 4):**
```bash
curl http://localhost:5110/health
```
Should return JSON with status "healthy"

**Check Socket.IO Bridge:**
```bash
curl http://localhost:3000/health
```
Should return JSON with server info

**Check React App:**
Open http://localhost:8080 in browser

## Expected Server Logs

### Flask API Should Show:
```
Loading YOLO model...
Model loaded successfully!
Starting Flask API on port 5110
API endpoints available at:
  http://localhost:5110/
  http://localhost:5110/detect
  http://localhost:5110/health
  http://localhost:5110/config
```

### Socket.IO Bridge Should Show:
```
🚀 Pose Detection Web App running on http://localhost:3000
📡 Flask API URL: http://localhost:5110
⏱️  Frame capture interval: 1100ms (0.91 FPS)
💡 Use 'npm run pose-server:dev' for development with auto-reload
```

### When Client Connects:
```
Client connected: [socket-id]
Starting pose detection for [socket-id]
```

## Common Issues & Solutions

### Issue 1: "Module not found" errors
```bash
# Install missing dependencies
npm install
```

### Issue 2: Python virtual environment not found
```bash
# Run setup first
npm run setup-pose
```

### Issue 3: Port already in use
```bash
# Find and kill processes using ports 3000 or 5110
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Issue 4: Flask API not starting
```bash
# Check Python installation
python --version

# Check if in virtual environment
which python  # Should show venv path

# Install requirements again
pip install -r requirements.txt
```

### Issue 5: YOLO model download issues
```bash
# Clear model cache and re-download
rm motionDetection/yolov8n-pose.pt
# Restart Flask API - it will re-download
```

## Testing the Integration

Once all servers are running:

1. **Open React app**: http://localhost:8080
2. **Click "Temu" button** (orange)
3. **Click Play button**
4. **Let video finish** or click "Close Ad"
5. **Camera should activate** for pose detection
6. **Raise both hands** above your head
7. **Should see success screen**

## Debug Mode

For more detailed logging, start the Socket.IO server with debug mode:

```bash
DEBUG=socket.io* node pose-detection-server.js
```

## Quick Test Commands

```bash
# Test all servers at once
npm run test-servers

# Test individual components
curl http://localhost:5110/health
curl http://localhost:3000/health

# Check if React app is running
curl http://localhost:8080
```

## If All Else Fails

1. **Restart your computer** (clears all port conflicts)
2. **Re-run setup**: `npm run setup-pose`
3. **Start servers manually** one by one
4. **Check firewall settings** (allow ports 3000, 5110, 8080)
5. **Try different ports** if there are conflicts

## Getting Help

If you're still having issues, please share:
1. Output of `npm run test-servers`
2. Complete error logs from each terminal
3. Your operating system
4. Node.js version (`node --version`)
5. Python version (`python --version`)
