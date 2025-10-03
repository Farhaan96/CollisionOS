@echo off
echo 📸 Capturing all CollisionOS UI pages...
echo.

node scripts/ui-preview.js

echo.
echo ✅ All screenshots saved to /screenshots folder
echo You can now share these with Claude to get UI feedback!
pause
