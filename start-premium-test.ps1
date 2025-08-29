Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CollisionOS Premium UI Test Mode" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting the application in UI test mode..." -ForegroundColor Green
Write-Host ""
Write-Host "Premium Features Ready:" -ForegroundColor Cyan
Write-Host "✨ Executive Login Page with animations" -ForegroundColor White
Write-Host "📊 Drag-and-drop Dashboard Widgets" -ForegroundColor White
Write-Host "⌨️ Command Palette (Cmd+K or Ctrl+K)" -ForegroundColor White
Write-Host "🌓 Theme Switcher (Dark/Light/Auto)" -ForegroundColor White
Write-Host "📋 Virtual Data Tables (10,000+ rows)" -ForegroundColor White
Write-Host "📝 Smart Forms with validation" -ForegroundColor White
Write-Host "🔔 Notification System" -ForegroundColor White
Write-Host "⏳ Skeleton Loaders" -ForegroundColor White
Write-Host ""

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Application will open at:" -ForegroundColor Green
Write-Host "   http://localhost:3000" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Cyan
Write-Host "  Admin: admin@collisionos.com / admin123" -ForegroundColor White
Write-Host "  Manager: manager@collisionos.com / manager123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev:ui