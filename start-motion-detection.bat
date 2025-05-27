@echo off
echo Starting Motion Detection System...
echo.

REM Check if Python virtual environment exists
if not exist "motionDetection\venv" (
    echo Error: Python virtual environment not found at motionDetection\venv
    echo Please run setup-pose-detection.js first
    pause
    exit /b 1
)

REM Start Flask API server in background
echo Starting Flask API server on port 5110...
start "Flask API Server" cmd /k "cd motionDetection && venv\Scripts\activate && python pose_api.py"

REM Wait a moment for Flask to start
timeout /t 3 /nobreak >nul

REM Start Socket.IO bridge server in background
echo Starting Socket.IO bridge server on port 3000...
start "Socket.IO Bridge" cmd /k "node pose-detection-server.js"

REM Wait a moment for Socket.IO to start
timeout /t 2 /nobreak >nul

echo.
echo Motion Detection System Started!
echo.
echo Flask API Server: http://localhost:5110
echo Socket.IO Bridge: http://localhost:3000
echo.
echo Your React app should now be able to connect to the motion detection system.
echo.
echo To stop the servers, close the opened command windows.
echo.
pause
