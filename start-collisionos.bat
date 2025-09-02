@echo off
echo.
echo ===============================================
echo    CollisionOS - Collision Repair Management
echo ===============================================
echo.
echo Starting CollisionOS with automated parts sourcing...
echo.
echo Server will start on: http://localhost:3001
echo Frontend will start on: http://localhost:3000
echo Desktop app will launch automatically
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start CollisionOS with both server and client
npm start

echo.
echo CollisionOS has stopped.
pause