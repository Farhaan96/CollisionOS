@echo off
echo.
echo ╔═══════════════════════════════════════════╗
echo ║           🚗 CollisionOS Launcher           ║
echo ║      Auto Body Shop Management System      ║
echo ╚═══════════════════════════════════════════╝
echo.
echo Starting CollisionOS Desktop Application...
echo.

REM Change to the CollisionOS directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Dependencies not found. Installing...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo ❌ Failed to install dependencies.
        echo Please run 'npm install' manually.
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencies installed successfully!
    echo.
)

REM Check if database needs to be initialized
if not exist "data\collisionos.db" (
    echo 📊 Initializing database...
    npm run db:migrate
    npm run db:seed
    echo ✅ Database initialized!
    echo.
)

echo 🚀 Launching CollisionOS...
echo.
echo The application will open in a desktop window.
echo You can also access it in your browser at http://localhost:3003
echo.
echo To close the application, close this window or press Ctrl+C
echo.

REM Start the application in development mode with Electron
npm run dev

REM If the command fails, show error message
if errorlevel 1 (
    echo.
    echo ❌ Failed to start CollisionOS.
    echo.
    echo Possible solutions:
    echo 1. Make sure Node.js is installed
    echo 2. Run 'npm install' to install dependencies
    echo 3. Check if ports 3003 and 3005 are available
    echo.
    pause
)