@echo off
echo ==========================================
echo   CollisionOS Premium UI Test Mode
echo ==========================================
echo.
echo Starting the application in UI test mode...
echo.
echo Premium Features Ready:
echo - Executive Login Page with animations
echo - Drag-and-drop Dashboard Widgets
echo - Command Palette (Cmd+K or Ctrl+K)
echo - Theme Switcher (Dark/Light/Auto)
echo - Virtual Data Tables (10,000+ rows)
echo - Smart Forms with validation
echo - Notification System
echo - Skeleton Loaders
echo.
echo Starting server and client...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo ==========================================
echo   Application will open at:
echo   http://localhost:3000
echo ==========================================
echo.
echo Test Accounts:
echo   Admin: admin@collisionos.com / admin123
echo   Manager: manager@collisionos.com / manager123
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the application
call npm run dev:ui