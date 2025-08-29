# Create Desktop Shortcut for CollisionOS
# Run this script to create a shortcut on your desktop

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "CollisionOS.lnk"
$BatFilePath = Join-Path $ScriptPath "Launch CollisionOS.bat"

# Create WScript.Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create the shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $BatFilePath
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.Description = "CollisionOS - Auto Body Shop Management System"
$Shortcut.IconLocation = "shell32.dll,25"  # Computer icon
$Shortcut.Save()

Write-Host ""
Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "📍 Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click the CollisionOS shortcut on your desktop to launch the app." -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"