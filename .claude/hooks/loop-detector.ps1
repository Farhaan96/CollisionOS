# Enhanced Loop Detection and Control Hook for CollisionOS
# Smart detection that allows legitimate agent operations while preventing infinite loops

param(
    [string]$Operation = "check",
    [string]$Context = "unknown",
    [string]$FilePath = "",
    [string]$AgentName = "unknown"
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

# Enhanced loop control settings - Agent coordination friendly
$loopControl = @{
    maxRestartsPerMinute = 8                    # Higher for multi-agent operations
    hookCooldownMs = 800                        # Reduced for faster agent coordination
    enableLoopDetection = $true
    maxConsecutiveFailures = 6                  # Higher threshold for legitimate failures
    maxFailuresInWindow = 12                    # Max failures in time window
    failureWindowMs = 300000                    # 5-minute failure window
    stabilizationDelayMs = 2000                 # Reduced delay
    agentOperationThreshold = 20                # Allow many operations for agent coordination
    enableProgressiveRestrictions = $true       # Enable graduated responses
    warningThreshold = 4                        # Warn at 4 consecutive failures
    
    # Legitimate agent operation patterns (these bypass strict failure counting)
    agentOperationPatterns = @(
        "components/",
        "src/",
        "lib/",
        "services/",
        "api/",
        "pages/",
        "dashboard/",
        ".ts",
        ".js",
        ".jsx",
        ".tsx",
        ".vue",
        ".css",
        ".scss"
    )
    
    # Operation contexts that are considered safe
    safeContexts = @(
        "agent-coordination",
        "multi-file-operation", 
        "dashboard-generation",
        "component-creation",
        "parts-sourcing",
        "collision-repair"
    )
}

if ($settings.loopControl) {
    $settings.loopControl.PSObject.Properties | ForEach-Object {
        $loopControl[$_.Name] = $_.Value
    }
}

# Load or initialize enhanced loop state
$loopState = @{
    restarts = @()
    lastHookExecution = 0
    consecutiveFailures = 0
    failureHistory = @()                        # Track failures with timestamps and context
    recentOperations = @()                      # Track recent operations for pattern detection
    isLoopDetected = $false
    isPaused = $false
    warningIssued = $false                      # Track if warning has been issued
    lastWarningTime = 0
    agentOperationCount = 0                     # Count of recent agent operations
    lastAgentOperation = 0                      # Timestamp of last agent operation
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

# Enhanced utility functions for smart loop detection

# Function to clean old restart records
function Clean-OldRestarts {
    $oneMinuteAgo = $now - 60000
    if ($loopState.restarts) {
        $loopState.restarts = $loopState.restarts | Where-Object { $_ -gt $oneMinuteAgo }
    } else {
        $loopState.restarts = @()
    }
}

# Function to clean old failure history
function Clean-OldFailures {
    $windowStart = $now - $loopControl.failureWindowMs
    if ($loopState.failureHistory) {
        $loopState.failureHistory = $loopState.failureHistory | Where-Object { $_.timestamp -gt $windowStart }
    } else {
        $loopState.failureHistory = @()
    }
}

# Function to clean old operation records
function Clean-OldOperations {
    $fiveMinutesAgo = $now - 300000
    if ($loopState.recentOperations) {
        $loopState.recentOperations = $loopState.recentOperations | Where-Object { $_.timestamp -gt $fiveMinutesAgo }
    } else {
        $loopState.recentOperations = @()
    }
}

# Check if current operation is a legitimate agent operation
function Test-LegitimateAgentOperation {
    param([string]$filePath, [string]$context)
    
    # Check for safe contexts
    if ($context -in $loopControl.safeContexts) {
        return $true
    }
    
    # Check for agent operation file patterns
    foreach ($pattern in $loopControl.agentOperationPatterns) {
        if ($filePath -like "*$pattern*") {
            return $true
        }
    }
    
    return $false
}

# Check if hook cooldown is active (reduced for agent operations)
function Test-CooldownActive {
    if ($loopState.lastHookExecution -eq 0) { return $false }
    $timeSinceLastHook = $now - $loopState.lastHookExecution
    
    # Shorter cooldown for legitimate agent operations
    if (Test-LegitimateAgentOperation -filePath $FilePath -context $Context) {
        return $timeSinceLastHook -lt ($loopControl.hookCooldownMs / 2)
    }
    
    return $timeSinceLastHook -lt $loopControl.hookCooldownMs
}

# Enhanced loop detection with context awareness
function Test-LoopDetected {
    if (-not $loopControl.enableLoopDetection) { return $false }
    
    Clean-OldRestarts
    Clean-OldFailures
    Clean-OldOperations
    
    # Check restart frequency
    $recentRestarts = if ($loopState.restarts) { $loopState.restarts.Count } else { 0 }
    if ($recentRestarts -ge $loopControl.maxRestartsPerMinute) {
        Write-Host "Loop detected: Too many restarts ($recentRestarts in 1 minute)" -ForegroundColor Yellow
        return $true
    }
    
    # Check if this is a legitimate agent operation
    $isLegitimateOperation = Test-LegitimateAgentOperation -filePath $FilePath -context $Context
    
    # More lenient for legitimate agent operations
    if ($isLegitimateOperation) {
        $maxFailures = $loopControl.maxConsecutiveFailures * 2  # Double the threshold
        $loopState.agentOperationCount++
        $loopState.lastAgentOperation = $now
        
        # Allow many more operations for agent coordination
        if ($loopState.agentOperationCount -lt $loopControl.agentOperationThreshold) {
            return $false
        }
    } else {
        $maxFailures = $loopControl.maxConsecutiveFailures
    }
    
    # Check consecutive failures with context
    if ($loopState.consecutiveFailures -ge $maxFailures) {
        Write-Host "Loop detected: Too many consecutive failures ($($loopState.consecutiveFailures))" -ForegroundColor Yellow
        return $true
    }
    
    # Check failures in time window
    $failuresInWindow = if ($loopState.failureHistory) { $loopState.failureHistory.Count } else { 0 }
    if ($failuresInWindow -ge $loopControl.maxFailuresInWindow) {
        Write-Host "Loop detected: Too many failures in window ($failuresInWindow in 5 minutes)" -ForegroundColor Yellow
        return $true
    }
    
    return $false
}

# Issue progressive warnings before blocking
function Issue-ProgressiveWarning {
    if ($loopControl.enableProgressiveRestrictions -and $loopState.consecutiveFailures -ge $loopControl.warningThreshold) {
        $timeSinceLastWarning = $now - $loopState.lastWarningTime
        
        # Only warn once per minute
        if ($timeSinceLastWarning -gt 60000 -or $loopState.lastWarningTime -eq 0) {
            Write-Host "Warning: $($loopState.consecutiveFailures) consecutive failures detected" -ForegroundColor Yellow
            Write-Host "Consider checking for issues. Will pause at $($loopControl.maxConsecutiveFailures) failures." -ForegroundColor Gray
            $loopState.warningIssued = $true
            $loopState.lastWarningTime = $now
            Save-LoopState
        }
    }
}

# Main logic based on operation
switch ($Operation.ToLower()) {
    "check" {
        # Check if this is a legitimate agent operation
        $isLegitimateOperation = Test-LegitimateAgentOperation -filePath $FilePath -context $Context
        
        # Check if we should block execution
        if ($loopState.isPaused) {
            # Allow legitimate agent operations even when paused, with higher threshold
            if ($isLegitimateOperation -and $loopState.consecutiveFailures -lt ($loopControl.maxConsecutiveFailures * 2)) {
                Write-Host "Allowing legitimate agent operation: $Context" -ForegroundColor Cyan
                $loopState.lastHookExecution = $now
                Save-LoopState
                exit 0
            }
            
            Write-Host "Automation paused due to loop detection" -ForegroundColor Yellow
            Write-Host "Context: $Context, File: $FilePath" -ForegroundColor Gray
            Write-Host "Run 'powershell .claude/hooks/loop-detector.ps1 resume' to resume" -ForegroundColor Gray
            exit 2
        }
        
        # Issue progressive warnings
        Issue-ProgressiveWarning
        
        # Reduced cooldown for legitimate agent operations
        if (Test-CooldownActive) {
            $cooldownMs = if ($isLegitimateOperation) { $loopControl.hookCooldownMs / 2 } else { $loopControl.hookCooldownMs }
            Write-Host "Hook cooldown active ($cooldownMs ms)..." -ForegroundColor Yellow
            Start-Sleep -Milliseconds ($cooldownMs / 1000)
        }
        
        # Enhanced loop detection with context
        $loopState.isLoopDetected = Test-LoopDetected
        if ($loopState.isLoopDetected) {
            Write-Host "Loop detected! Context: $Context, File: $(Split-Path -Leaf $FilePath)" -ForegroundColor Red
            $loopState.isPaused = $true
            Save-LoopState
            exit 2
        }
        
        $loopState.lastHookExecution = $now
        Save-LoopState
        
        $statusMsg = if ($isLegitimateOperation) { "Agent operation allowed" } else { "System stable" }
        Write-Host "Loop detector: $statusMsg" -ForegroundColor Green
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
        # Add failure to history with context
        $failure = @{
            timestamp = $now
            context = $Context
            filePath = $FilePath
        }
        $loopState.failureHistory += $failure
        
        # Only count as consecutive if it's not a legitimate agent operation failure
        $isLegitimateFailure = Test-LegitimateAgentOperation -filePath $FilePath -context $Context
        if (-not $isLegitimateFailure) {
            $loopState.consecutiveFailures++
            Write-Host "System failure recorded (consecutive: $($loopState.consecutiveFailures))" -ForegroundColor Red
        } else {
            Write-Host "Agent operation failure recorded (not counted as consecutive)" -ForegroundColor Yellow
        }
        
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
        Clean-OldRestarts
        Clean-OldFailures
        Clean-OldOperations
        
        $recentRestarts = if ($loopState.restarts) { $loopState.restarts.Count } else { 0 }
        $failuresInWindow = if ($loopState.failureHistory) { $loopState.failureHistory.Count } else { 0 }
        $recentOps = if ($loopState.recentOperations) { $loopState.recentOperations.Count } else { 0 }
        
        Write-Host "Enhanced Loop Detector Status:" -ForegroundColor Cyan
        Write-Host "Paused: $($loopState.isPaused)" -ForegroundColor Yellow
        Write-Host "Loop Detected: $($loopState.isLoopDetected)" -ForegroundColor Yellow
        Write-Host "Recent Restarts (1min): $recentRestarts / $($loopControl.maxRestartsPerMinute)" -ForegroundColor Yellow
        Write-Host "Consecutive Failures: $($loopState.consecutiveFailures) / $($loopControl.maxConsecutiveFailures)" -ForegroundColor Yellow
        Write-Host "Failures in Window (5min): $failuresInWindow / $($loopControl.maxFailuresInWindow)" -ForegroundColor Yellow
        Write-Host "Recent Operations (5min): $recentOps" -ForegroundColor Yellow
        Write-Host "Agent Operations: $($loopState.agentOperationCount) / $($loopControl.agentOperationThreshold)" -ForegroundColor Yellow
        Write-Host "Warning Issued: $($loopState.warningIssued)" -ForegroundColor Yellow
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