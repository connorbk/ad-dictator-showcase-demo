#!/bin/bash

echo "Starting Motion Detection System..."
echo

# Check if Python virtual environment exists
if [ ! -d "motionDetection/venv" ]; then
    echo "Error: Python virtual environment not found at motionDetection/venv"
    echo "Please run setup-pose-detection.js first"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $FLASK_PID $SOCKETIO_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Flask API server in background
echo "Starting Flask API server on port 5110..."
cd motionDetection
source venv/bin/activate
python pose_api.py &
FLASK_PID=$!
cd ..

# Wait a moment for Flask to start
sleep 3

# Start Socket.IO bridge server in background
echo "Starting Socket.IO bridge server on port 3000..."
node pose-detection-server.js &
SOCKETIO_PID=$!

# Wait a moment for Socket.IO to start
sleep 2

echo
echo "Motion Detection System Started!"
echo
echo "Flask API Server: http://localhost:5110"
echo "Socket.IO Bridge: http://localhost:3000"
echo
echo "Your React app should now be able to connect to the motion detection system."
echo
echo "Press Ctrl+C to stop all servers."
echo

# Wait for user to stop
wait
