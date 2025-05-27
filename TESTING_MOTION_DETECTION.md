# Testing Motion Detection Integration

This guide explains how to test the newly integrated motion detection system in the Temu demo.

## What Changed

The Temu demo now uses **pose detection** instead of voice detection:

1. **Video plays** → User watches Temu ad
2. **Video ends** → Pose detection starts automatically  
3. **User raises hands** → Success screen shows
4. **15-second timeout** → Video restarts and loop continues

This mirrors the McDonald's demo flow but uses pose detection instead of facial recognition.

## Setup Instructions

### 1. Start Motion Detection Servers

**Windows:**
```bash
npm run start-motion-detection:windows
```

**Linux/Mac:**
```bash
npm run start-motion-detection
```

**Manual Setup (if automated fails):**
```bash
# Terminal 1: Flask API
npm run flask-api

# Terminal 2: Socket.IO Bridge  
npm run pose-server

# Terminal 3: React App
npm run dev
```

### 2. Verify Servers Are Running

Check that all servers are active:
- Flask API: http://localhost:5110/health
- Socket.IO Bridge: http://localhost:3000/health  
- React App: http://localhost:8080

## Testing the Temu Demo

### 1. Navigate to Demo
1. Open your React app (http://localhost:8080)
2. Scroll to the "Live Demo" section
3. Click the **"Temu"** button (orange button)

### 2. Start the Demo
1. Click the **Play** button
2. Temu video will start playing
3. Let the video play to completion (or click "Close Ad")

### 3. Pose Detection Phase
1. After video ends, pose detection automatically starts
2. You'll see your camera feed with pose detection overlay
3. **Raise both hands above your head** to trigger detection
4. Success screen should appear when pose is detected

### 4. Test Timeout Behavior
1. Start the demo again
2. When pose detection starts, **don't raise your hands**
3. After 15 seconds, the video should restart automatically
4. This creates the loop behavior similar to McDonald's demo

## Expected Behavior

### Success Flow
```
Video Playing → Video Ends → Pose Detection → Hands Raised → Success Screen
```

### Timeout Flow  
```
Video Playing → Video Ends → Pose Detection → 15s Timeout → Video Restarts
```

### Manual Close Flow
```
Video Playing → Close Ad Button → Pose Detection → (Success or Timeout)
```

## Troubleshooting

### "Connection Failed" Error
- Ensure Flask API is running on port 5110
- Ensure Socket.IO bridge is running on port 3000
- Check console for connection errors

### Camera Not Working
- Allow camera permissions in browser
- Ensure no other apps are using camera
- Try refreshing the page

### Pose Detection Not Working
- Make sure to raise **both hands above your head**
- Ensure good lighting for camera
- Check that your full upper body is visible
- Try moving closer/further from camera

### Video Not Playing
- Check that `/videos/temu-ad.mp4` exists in public folder
- Verify video file is not corrupted
- Check browser console for video errors

## Debug Information

### Console Logs to Watch For
```
✅ Connected to pose detection server
✅ Pose detection started  
✅ Target pose detected!
✅ Pose detection completed successfully for Temu!
```

### Error Logs to Check
```
❌ Flask API error: 500
❌ Camera access denied
❌ Socket connection failed
❌ Pose detection timeout
```

### API Health Checks
```bash
# Check Flask API
curl http://localhost:5110/health

# Check Socket.IO Bridge
curl http://localhost:3000/health
```

## Comparison with McDonald's Demo

| Feature | McDonald's | Temu (New) |
|---------|------------|------------|
| Detection Type | Facial Recognition | Pose Detection |
| Trigger | Smile | Hands Raised |
| Timeout | 15 seconds | 15 seconds |
| Timeout Action | Restart Video | Restart Video |
| Success Action | Reward Video | Success Screen |
| Loop Behavior | ✅ Yes | ✅ Yes |

## Performance Tips

### For Faster Detection
- Ensure good lighting
- Position yourself 2-3 feet from camera
- Raise hands clearly above head
- Keep upper body in frame

### For Debugging
- Open browser developer tools
- Watch console for detection logs
- Check Network tab for API calls
- Monitor pose detection status messages

## Next Steps

Once testing is complete, you can:
1. Adjust timeout duration in `DemoSection.tsx`
2. Modify pose detection sensitivity in `motionDetection/config.py`
3. Customize success/failure messages
4. Add additional pose gestures
5. Integrate with analytics tracking
