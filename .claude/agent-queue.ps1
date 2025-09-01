# Agent Task Queue Manager for CollisionOS
# Coordinates agent tasks to prevent conflicts and excessive loops

param(
    [string]$Command = "status",
    [string]$TaskType = "",
    [string]$TaskData = "",
    [string]$Priority = "normal"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$queueFile = Join-Path $projectRoot ".claude/agent-queue.json"
$controlFile = Join-Path $projectRoot ".claude/loop-control.json"

# Initialize queue if it doesn't exist
if (-not (Test-Path $queueFile)) {
    $initialQueue = @{
        queue = @()
        processing = $false
        currentTask = $null
        lastProcessed = 0
        statistics = @{
            totalProcessed = 0
            averageDurationMs = 0
            errorCount = 0
        }
    }
    $initialQueue | ConvertTo-Json -Depth 5 | Out-File $queueFile -Encoding UTF8
}

# Load queue state
function Get-QueueState {
    try {
        return Get-Content $queueFile | ConvertFrom-Json
    } catch {
        Write-Host "Error loading queue state" -ForegroundColor Red
        return $null
    }
}

# Save queue state
function Save-QueueState($state) {
    try {
        $state | ConvertTo-Json -Depth 5 | Out-File $queueFile -Encoding UTF8
    } catch {
        Write-Host "Error saving queue state" -ForegroundColor Red
    }
}

# Load control configuration
function Get-ControlConfig {
    try {
        if (Test-Path $controlFile) {
            return Get-Content $controlFile | ConvertFrom-Json
        }
    } catch {
        Write-Host "Error loading control config" -ForegroundColor Yellow
    }
    
    # Return defaults if file doesn't exist or has errors
    return @{
        enabled = $true
        paused = $false
        maxQueueSize = 10
        queueProcessingDelayMs = 3000
    }
}

# Add task to queue
function Add-TaskToQueue($taskType, $taskData, $priority = "normal") {
    $state = Get-QueueState
    $control = Get-ControlConfig
    
    if (-not $state) { return $false }
    
    if ($state.queue.Count -ge $control.maxQueueSize) {
        Write-Host "⚠️  Queue is full, cannot add task" -ForegroundColor Yellow
        return $false
    }
    
    $task = @{
        id = [Guid]::NewGuid().ToString()
        type = $taskType
        data = $taskData
        priority = $priority
        createdAt = [DateTimeOffset]::UtcNow.ToString('o')
        attempts = 0
        maxAttempts = 3
    }
    
    # Insert based on priority
    if ($priority -eq "high") {
        $state.queue = @($task) + $state.queue
    } else {
        $state.queue += $task
    }
    
    Save-QueueState $state
    Write-Host "✅ Task added to queue: $taskType" -ForegroundColor Green
    return $true
}

# Process next task in queue
function Invoke-NextTask {
    $state = Get-QueueState
    $control = Get-ControlConfig
    
    if (-not $state -or $control.paused -or -not $control.enabled) {
        Write-Host "⏸️  Processing paused or disabled" -ForegroundColor Yellow
        return $false
    }
    
    if ($state.processing) {
        Write-Host "🔄 Already processing a task" -ForegroundColor Yellow
        return $false
    }
    
    if ($state.queue.Count -eq 0) {
        Write-Host "📭 No tasks in queue" -ForegroundColor Gray
        return $false
    }
    
    $task = $state.queue[0]
    $state.queue = $state.queue[1..($state.queue.Count-1)]
    $state.processing = $true
    $state.currentTask = $task
    
    Save-QueueState $state
    
    Write-Host "🚀 Processing task: $($task.type)" -ForegroundColor Cyan
    
    $startTime = [DateTimeOffset]::UtcNow
    $success = $false
    
    try {
        # Execute the task based on type
        switch ($task.type.ToLower()) {
            "code-review" {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/code-review.ps1" $task.data
                $success = $LASTEXITCODE -eq 0
            }
            "stabilization-check" {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/stabilization-check.ps1" $task.data "check"
                $success = $LASTEXITCODE -eq 0
            }
            "format-code" {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/format_on_edit.ps1" $task.data
                $success = $LASTEXITCODE -eq 0
            }
            default {
                Write-Host "⚠️  Unknown task type: $($task.type)" -ForegroundColor Yellow
                $success = $false
            }
        }
        
        $endTime = [DateTimeOffset]::UtcNow
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        # Update statistics
        $state.statistics.totalProcessed++
        $currentAvg = $state.statistics.averageDurationMs
        $state.statistics.averageDurationMs = (($currentAvg * ($state.statistics.totalProcessed - 1)) + $duration) / $state.statistics.totalProcessed
        
        if ($success) {
            Write-Host "✅ Task completed successfully in $([math]::Round($duration))ms" -ForegroundColor Green
            powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "success" | Out-Null
        } else {
            Write-Host "❌ Task failed" -ForegroundColor Red
            $state.statistics.errorCount++
            powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "failure" | Out-Null
            
            # Re-queue if attempts remaining
            $task.attempts++
            if ($task.attempts -lt $task.maxAttempts) {
                Write-Host "🔄 Re-queueing task (attempt $($task.attempts + 1)/$($task.maxAttempts))" -ForegroundColor Yellow
                $state.queue += $task
            }
        }
        
    } catch {
        Write-Host "💥 Task execution error: $($_.Exception.Message)" -ForegroundColor Red
        $state.statistics.errorCount++
    } finally {
        $state.processing = $false
        $state.currentTask = $null
        $state.lastProcessed = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        Save-QueueState $state
        
        # Wait before processing next task
        if ($control.queueProcessingDelayMs -gt 0) {
            Start-Sleep -Milliseconds $control.queueProcessingDelayMs
        }
    }
    
    return $success
}

# Main command processing
switch ($Command.ToLower()) {
    "add" {
        if (-not $TaskType) {
            Write-Host "Error: TaskType required for add command" -ForegroundColor Red
            exit 1
        }
        $success = Add-TaskToQueue $TaskType $TaskData $Priority
        exit $(if ($success) { 0 } else { 1 })
    }
    
    "process" {
        $success = Invoke-NextTask
        exit $(if ($success) { 0 } else { 1 })
    }
    
    "status" {
        $state = Get-QueueState
        $control = Get-ControlConfig
        
        Write-Host "`n🔍 Agent Queue Status:" -ForegroundColor Cyan
        Write-Host "====================" -ForegroundColor Cyan
        Write-Host "Enabled: $($control.enabled)" -ForegroundColor $(if ($control.enabled) { "Green" } else { "Red" })
        Write-Host "Paused: $($control.paused)" -ForegroundColor $(if ($control.paused) { "Red" } else { "Green" })
        Write-Host "Queue Size: $($state.queue.Count)/$($control.maxQueueSize)" -ForegroundColor Yellow
        Write-Host "Currently Processing: $($state.processing)" -ForegroundColor $(if ($state.processing) { "Yellow" } else { "Green" })
        
        if ($state.currentTask) {
            Write-Host "Current Task: $($state.currentTask.type)" -ForegroundColor Cyan
        }
        
        Write-Host "`nStatistics:" -ForegroundColor Cyan
        Write-Host "Total Processed: $($state.statistics.totalProcessed)" -ForegroundColor Gray
        Write-Host "Average Duration: $([math]::Round($state.statistics.averageDurationMs))ms" -ForegroundColor Gray
        Write-Host "Error Count: $($state.statistics.errorCount)" -ForegroundColor $(if ($state.statistics.errorCount -gt 0) { "Red" } else { "Green" })
        
        if ($state.queue.Count -gt 0) {
            Write-Host "`nPending Tasks:" -ForegroundColor Cyan
            $state.queue | ForEach-Object { Write-Host "  - $($_.type) [$($_.priority)]" -ForegroundColor Gray }
        }
        exit 0
    }
    
    "clear" {
        $state = Get-QueueState
        $state.queue = @()
        $state.processing = $false
        $state.currentTask = $null
        Save-QueueState $state
        Write-Host "🧹 Queue cleared" -ForegroundColor Green
        exit 0
    }
    
    "pause" {
        $control = Get-ControlConfig
        $control.paused = $true
        $control | ConvertTo-Json -Depth 5 | Out-File $controlFile -Encoding UTF8
        Write-Host "⏸️  Queue processing paused" -ForegroundColor Yellow
        exit 0
    }
    
    "resume" {
        $control = Get-ControlConfig
        $control.paused = $false
        $control | ConvertTo-Json -Depth 5 | Out-File $controlFile -Encoding UTF8
        Write-Host "▶️  Queue processing resumed" -ForegroundColor Green
        exit 0
    }
    
    "auto" {
        # Automatic processing mode - keep processing until queue is empty
        $control = Get-ControlConfig
        if ($control.paused -or -not $control.enabled) {
            Write-Host "⏸️  Auto-processing cannot start - system is paused or disabled" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "🔄 Starting automatic queue processing..." -ForegroundColor Cyan
        
        while ($true) {
            $state = Get-QueueState
            if ($state.queue.Count -eq 0) {
                Write-Host "✅ All tasks completed" -ForegroundColor Green
                break
            }
            
            $success = Invoke-NextTask
            if (-not $success) {
                Write-Host "⚠️  Task processing failed, stopping auto-mode" -ForegroundColor Yellow
                break
            }
        }
        exit 0
    }
    
    default {
        Write-Host "Usage: agent-queue.ps1 [add|process|status|clear|pause|resume|auto] [TaskType] [TaskData] [Priority]" -ForegroundColor Yellow
        Write-Host "Examples:" -ForegroundColor Gray
        Write-Host "  agent-queue.ps1 add code-review 'path/to/file.js' high" -ForegroundColor Gray
        Write-Host "  agent-queue.ps1 process" -ForegroundColor Gray
        Write-Host "  agent-queue.ps1 status" -ForegroundColor Gray
        exit 1
    }
}