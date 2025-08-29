Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CollisionOS Desktop App Restart Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Stopping any running CollisionOS processes..." -ForegroundColor Yellow
Get-Process -Name "CollisionOS" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "2. Clearing Electron cache..." -ForegroundColor Yellow
$cachePath = "$env:APPDATA\CollisionOS"
if (Test-Path $cachePath) {
    Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache cleared." -ForegroundColor Green
} else {
    Write-Host "No cache found." -ForegroundColor Gray
}

Write-Host "3. Starting CollisionOS Desktop App..." -ForegroundColor Yellow
Start-Process -FilePath "Launch CollisionOS.bat" -WindowStyle Normal

Write-Host ""
Write-Host "Desktop app is starting with fresh cache!" -ForegroundColor Green
Write-Host "Please wait for it to load completely." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"
