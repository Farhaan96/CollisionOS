@echo off
echo 📸 Taking CollisionOS Screenshot...
echo.

REM Default to dashboard if no arguments
if "%~1"=="" (
    node scripts/take-screenshot.js http://localhost:3000/dashboard dashboard.png
) else (
    node scripts/take-screenshot.js %*
)

echo.
echo ✅ Done! Check the screenshots folder.
pause
