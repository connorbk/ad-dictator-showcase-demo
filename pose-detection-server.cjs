const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Add fetch polyfill for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const FLASK_API_URL = 'http://localhost:5110';

// Frame capture timing configuration
const FRAME_INTERVAL_MS = 1100; // Exactly 1.1 seconds
const FRAME_QUALITY = 0.8; // JPEG quality for frame capture

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pose-detection.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'pose-detector-web-app',
    flask_api: FLASK_API_URL,
    frame_interval_ms: FRAME_INTERVAL_MS,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let frameInterval = null;
  let frameCounter = 0;
  let isCapturing = false;

  socket.emit('connected', {
    session_id: socket.id,
    flask_api: FLASK_API_URL,
    frame_interval_ms: FRAME_INTERVAL_MS
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (frameInterval) {
      clearInterval(frameInterval);
      frameInterval = null;
    }
  });

  // Start pose detection with precise timing
  socket.on('start_pose_detection', (data) => {
    console.log(`Starting pose detection for ${socket.id}`);

    if (frameInterval) {
      clearInterval(frameInterval);
    }

    isCapturing = true;
    frameCounter = 0;

    socket.emit('pose_detection_started', {
      frame_interval_ms: FRAME_INTERVAL_MS,
      timestamp: Date.now()
    });

    // Request initial frame immediately
    socket.emit('request_frame', {
      frame_number: frameCounter++,
      timestamp: Date.now()
    });

    // Set up precise interval for subsequent frames
    frameInterval = setInterval(() => {
      if (isCapturing) {
        socket.emit('request_frame', {
          frame_number: frameCounter++,
          timestamp: Date.now()
        });
      }
    }, FRAME_INTERVAL_MS);
  });

  // Stop pose detection
  socket.on('stop_pose_detection', () => {
    console.log(`Stopping pose detection for ${socket.id}`);

    if (frameInterval) {
      clearInterval(frameInterval);
      frameInterval = null;
    }

    isCapturing = false;
    frameCounter = 0;

    socket.emit('pose_detection_stopped', {
      timestamp: Date.now()
    });
  });

  // Handle pose detection requests
  socket.on('detect_pose', async (data) => {
    try {
      const startTime = Date.now();

      if (!data.image) {
        socket.emit('pose_error', {
          error: 'No image data provided',
          frame_number: data.frame_number
        });
        return;
      }

      const response = await fetch(`${FLASK_API_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: data.image,
          return_image: data.return_image || false,
          draw_keypoints: data.draw_keypoints || true
        })
      });

      if (!response.ok) {
        throw new Error(`Flask API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      socket.emit('pose_result', {
        ...result,
        frame_number: data.frame_number,
        capture_timestamp: data.timestamp,
        processing_timestamp: Date.now(),
        total_processing_time_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error('Error calling Flask API:', error);
      socket.emit('pose_error', {
        error: error.message,
        frame_number: data.frame_number,
        timestamp: Date.now()
      });
    }
  });

  // Health check for Flask API
  socket.on('check_api_health', async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/health`);
      const data = await response.json();
      socket.emit('api_health', { status: 'online', data });
    } catch (error) {
      socket.emit('api_health', { status: 'offline', error: error.message });
    }
  });

  // Get Flask API configuration
  socket.on('get_api_config', async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/config`);
      const config = await response.json();
      socket.emit('api_config', { success: true, config });
    } catch (error) {
      socket.emit('api_config', { success: false, error: error.message });
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Pose Detection Web App running on http://localhost:${PORT}`);
  console.log(`📡 Flask API URL: ${FLASK_API_URL}`);
  console.log(`⏱️  Frame capture interval: ${FRAME_INTERVAL_MS}ms (${(1000/FRAME_INTERVAL_MS).toFixed(2)} FPS)`);
  console.log(`💡 Use 'npm run pose-server:dev' for development with auto-reload`);
});

module.exports = app;
