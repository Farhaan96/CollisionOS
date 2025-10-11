@echo off
REM CollisionOS Browser Mode Quick Start
REM This launches the app in browser mode (recommended)

title CollisionOS - Starting...
color 0A

echo.
echo ========================================
echo   CollisionOS - Browser Mode
echo ========================================
echo.
echo Starting backend server...
start "CollisionOS Backend" cmd /k "npm run dev:server"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting frontend...
start "CollisionOS Frontend" cmd /k "npm run dev:ui"

echo Waiting for frontend to build...
timeout /t 10 /nobreak > nul

echo Opening browser...
REM Only open browser if not already running
start http://localhost:3000

echo.
echo ========================================
echo   CollisionOS is running!
echo ========================================
echo.
echo Backend:  http://localhost:3002
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT: Do not close the backend or frontend windows!
echo To stop CollisionOS, close both terminal windows.
echo.
echo Press any key to exit this launcher...
pause > nul
