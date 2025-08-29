@echo off
echo ========================================
echo CollisionOS Desktop App Restart Script
echo ========================================
echo.

echo 1. Stopping any running CollisionOS processes...
taskkill /F /IM "CollisionOS.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
timeout /t 2 /nobreak >nul

echo 2. Clearing Electron cache...
if exist "%APPDATA%\CollisionOS" (
    rmdir /s /q "%APPDATA%\CollisionOS" 2>nul
    echo Cache cleared.
) else (
    echo No cache found.
)

echo 3. Starting CollisionOS Desktop App...
start "" "Launch CollisionOS.bat"

echo.
echo Desktop app is starting with fresh cache!
echo Please wait for it to load completely.
echo.
pause
