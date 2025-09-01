# Loop Detection and Control Hook for CollisionOS
# Monitors restart frequency and prevents excessive loops

param(
    [string]$Operation = "check",
    [string]$Context = "unknown"
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$loopStateFile = Join-Path $projectRoot ".claude/loop-state.json"
$settingsFile = Join-Path $projectRoot ".claude/settings.local.json"

# Load settings
$settings = @{}
if (Test-Path $settingsFile) {
    try {
        $settings = Get-Content $settingsFile | ConvertFrom-Json
    } catch {
        Write-Host "Warning: Could not load settings" -ForegroundColor Yellow
    }
}

# Default loop control settings
$loopControl = @{
    maxRestartsPerMinute = 5
    hookCooldownMs = 2000
    enableLoopDetection = $true
    maxConsecutiveFailures = 3
    stabilizationDelayMs = 5000
}

if ($settings.loopControl) {
    $settings.loopControl.PSObject.Properties | ForEach-Object {
        $loopControl[$_.Name] = $_.Value
    }
}

# Load or initialize loop state
$loopState = @{
    restarts = @()
    lastHookExecution = 0
    consecutiveFailures = 0
    isLoopDetected = $false
    isPaused = $false
}

if (Test-Path $loopStateFile) {
    try {
        $savedState = Get-Content $loopStateFile | ConvertFrom-Json
        $savedState.PSObject.Properties | ForEach-Object {
            $loopState[$_.Name] = $_.Value
        }
    } catch {
        Write-Host "Warning: Could not load loop state, using defaults" -ForegroundColor Yellow
    }
}

# Current timestamp
$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Function to save loop state
function Save-LoopState {
    try {
        $loopState | ConvertTo-Json | Out-File $loopStateFile -Encoding UTF8
    } catch {
        Write-Host "Warning: Could not save loop state" -ForegroundColor Yellow
    }
}

# Function to clean old restart records
function Clean-OldRestarts {
    $oneMinuteAgo = $now - 60000
    $loopState.restarts = $loopState.restarts | Where-Object { $_ -gt $oneMinuteAgo }
}

# Check if hook cooldown is active
function Test-CooldownActive {
    if ($loopState.lastHookExecution -eq 0) { return $false }
    $timeSinceLastHook = $now - $loopState.lastHookExecution
    return $timeSinceLastHook -lt $loopControl.hookCooldownMs
}

# Check if loop is detected
function Test-LoopDetected {
    if (-not $loopControl.enableLoopDetection) { return $false }
    
    Clean-OldRestarts
    
    # Check restart frequency
    $recentRestarts = $loopState.restarts.Count
    if ($recentRestarts -ge $loopControl.maxRestartsPerMinute) {
        return $true
    }
    
    # Check consecutive failures
    if ($loopState.consecutiveFailures -ge $loopControl.maxConsecutiveFailures) {
        return $true
    }
    
    return $false
}

# Main logic based on operation
switch ($Operation.ToLower()) {
    "check" {
        # Check if we should block execution
        if ($loopState.isPaused) {
            Write-Host "Automation paused due to loop detection" -ForegroundColor Yellow
            Write-Host "Run 'powershell .claude/hooks/loop-detector.ps1 resume' to resume" -ForegroundColor Gray
            exit 2
        }
        
        if (Test-CooldownActive) {
            Write-Host "Hook cooldown active, waiting..." -ForegroundColor Yellow
            Start-Sleep -Milliseconds ($loopControl.hookCooldownMs / 1000)
        }
        
        $loopState.isLoopDetected = Test-LoopDetected
        if ($loopState.isLoopDetected) {
            Write-Host "Loop detected! Pausing automation" -ForegroundColor Red
            $loopState.isPaused = $true
            Save-LoopState
            exit 2
        }
        
        $loopState.lastHookExecution = $now
        Save-LoopState
        Write-Host "Loop detector: System stable" -ForegroundColor Green
        exit 0
    }
    
    "restart" {
        Clean-OldRestarts
        $loopState.restarts += $now
        Write-Host "Restart recorded" -ForegroundColor Cyan
        Save-LoopState
        exit 0
    }
    
    "failure" {
        $loopState.consecutiveFailures++
        Write-Host "Failure recorded" -ForegroundColor Red
        Save-LoopState
        exit 0
    }
    
    "success" {
        $loopState.consecutiveFailures = 0
        Write-Host "Success recorded" -ForegroundColor Green
        Save-LoopState
        exit 0
    }
    
    "pause" {
        $loopState.isPaused = $true
        Save-LoopState
        Write-Host "Automation paused manually" -ForegroundColor Yellow
        exit 0
    }
    
    "resume" {
        $loopState.isPaused = $false
        $loopState.isLoopDetected = $false
        $loopState.consecutiveFailures = 0
        $loopState.restarts = @()
        Save-LoopState
        Write-Host "Automation resumed" -ForegroundColor Green
        exit 0
    }
    
    "status" {
        Write-Host "Loop Detector Status:" -ForegroundColor Cyan
        Write-Host "Paused: $($loopState.isPaused)" -ForegroundColor Yellow
        Write-Host "Loop Detected: $($loopState.isLoopDetected)" -ForegroundColor Yellow
        Write-Host "Recent Restarts: $(($loopState.restarts).Count)" -ForegroundColor Yellow
        Write-Host "Consecutive Failures: $($loopState.consecutiveFailures)" -ForegroundColor Yellow
        exit 0
    }
    
    "clean" {
        if (Test-Path $loopStateFile) {
            Remove-Item $loopStateFile -Force
            Write-Host "Loop state cleaned" -ForegroundColor Green
        }
        exit 0
    }
    
    default {
        Write-Host "Usage: loop-detector.ps1 [check|restart|failure|success|pause|resume|status|clean]" -ForegroundColor Yellow
        exit 1
    }
}