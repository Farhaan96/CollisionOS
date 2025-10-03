@echo off
echo.
echo ========================================
echo  CollisionOS Dashboard Screenshot Tool
echo ========================================
echo.
echo INSTRUCTIONS:
echo 1. Make sure CollisionOS is running (npm run dev:electron)
echo 2. Login to the app first (username: admin, password: admin123)
echo 3. Navigate to the dashboard page
echo 4. Then run this script
echo.
echo This will capture a screenshot of the CURRENTLY DISPLAYED page
echo.
pause
echo.
echo 📸 Capturing screenshot...
node scripts/take-screenshot.js http://localhost:3000/dashboard dashboard-current.png
echo.
echo ✅ Done! Check screenshots/dashboard-current.png
echo.
pause
