# CollisionOS Desktop App Launcher
# PowerShell script to launch the CollisionOS application

param(
    [switch]$SkipDependencies,
    [switch]$DebugMode,
    [switch]$WebOnly
)

# Set console colors and title
$Host.UI.RawUI.WindowTitle = "CollisionOS Launcher"
$Host.UI.RawUI.BackgroundColor = "DarkBlue"
$Host.UI.RawUI.ForegroundColor = "White"
Clear-Host

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🚗 CollisionOS Launcher           ║" -ForegroundColor Cyan
Write-Host "║      Auto Body Shop Management System      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to the script directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptPath

Write-Host "📍 Working Directory: " -NoNewline -ForegroundColor Yellow
Write-Host $ScriptPath -ForegroundColor White
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js and npm are available" -ForegroundColor Green

# Check and install dependencies
if (-not $SkipDependencies -and -not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

# Initialize database if needed
if (-not (Test-Path "data\collisionos.db")) {
    Write-Host ""
    Write-Host "📊 Initializing database..." -ForegroundColor Yellow
    
    try {
        & npm run db:migrate
        & npm run db:seed
        Write-Host "✅ Database initialized successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Database initialization failed, but continuing..." -ForegroundColor Yellow
    }
}

# Choose launch mode
Write-Host ""
if ($DebugMode) {
    Write-Host "🐛 Launching in DEBUG mode..." -ForegroundColor Magenta
    $LaunchCommand = "npm run dev:debug"
} elseif ($WebOnly) {
    Write-Host "🌐 Launching WEB-ONLY mode..." -ForegroundColor Blue
    $LaunchCommand = "npm start"
} else {
    Write-Host "🚀 Launching CollisionOS Desktop App..." -ForegroundColor Green
    $LaunchCommand = "npm run dev"
}

Write-Host ""
Write-Host "🌐 Web interface will be available at: http://localhost:3003" -ForegroundColor Cyan
if (-not $WebOnly) {
    Write-Host "🖥️  Desktop window will open automatically" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "📝 Press Ctrl+C to stop the application" -ForegroundColor Gray
Write-Host ""

# Launch the application
try {
    Invoke-Expression $LaunchCommand
} catch {
    Write-Host ""
    Write-Host "❌ Failed to start CollisionOS" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure ports 3003 and 3005 are not in use" -ForegroundColor White
    Write-Host "2. Try running with -SkipDependencies flag" -ForegroundColor White
    Write-Host "3. Check if all dependencies are installed correctly" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}