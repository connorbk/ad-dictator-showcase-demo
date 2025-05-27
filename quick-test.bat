@echo off
echo Testing Motion Detection Servers...
echo.

echo Testing Flask API (port 5110)...
curl -s http://localhost:5110/health
if %errorlevel% equ 0 (
    echo ✅ Flask API is running
) else (
    echo ❌ Flask API is not running
)
echo.

echo Testing Socket.IO Bridge (port 3000)...
curl -s http://localhost:3000/health
if %errorlevel% equ 0 (
    echo ✅ Socket.IO Bridge is running
) else (
    echo ❌ Socket.IO Bridge is not running
)
echo.

echo Testing React App (port 8080)...
curl -s http://localhost:8080
if %errorlevel% equ 0 (
    echo ✅ React App is running
) else (
    echo ❌ React App is not running
)
echo.

echo If any servers are not running, start them manually:
echo 1. Flask API: cd motionDetection ^&^& venv\Scripts\activate ^&^& python pose_api.py
echo 2. Socket.IO: node pose-detection-server.js
echo 3. React App: npm run dev
echo.
pause
