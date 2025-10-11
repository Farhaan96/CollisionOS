@echo off
REM Clean CollisionOS Startup - Prevents Multiple Browser Tabs
REM This script starts CollisionOS without opening multiple browser tabs

title CollisionOS - Clean Startup
color 0A

echo.
echo ========================================
echo   CollisionOS - Clean Startup
echo ========================================
echo.

REM Kill any existing Node processes to prevent conflicts
echo Stopping any existing processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting CollisionOS...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo The app will open in a single browser tab.
echo.

REM Start the app using npm run dev (which includes Electron)
npm run dev

echo.
echo CollisionOS has stopped.
pause
