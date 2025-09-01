# CollisionOS Loop Management Control Script
# Master control for agent workflow automation system

param(
    [string]$Command = "status",
    [string]$Component = "all"
)

$projectRoot = Split-Path -Parent $PSScriptRoot

function Write-Header($text) {
    Write-Host "`n$('=' * 50)" -ForegroundColor Cyan
    Write-Host $text -ForegroundColor Cyan
    Write-Host $('=' * 50) -ForegroundColor Cyan
}

function Write-Status($component, $status, $details = "") {
    $color = switch ($status) {
        "ACTIVE" { "Green" }
        "PAUSED" { "Yellow" }
        "ERROR" { "Red" }
        "DISABLED" { "Gray" }
        default { "White" }
    }
    
    Write-Host "$($component.PadRight(20)) [$status]" -ForegroundColor $color
    if ($details) {
        Write-Host "$(' ' * 22)$details" -ForegroundColor Gray
    }
}

function Get-ComponentStatus($componentName) {
    switch ($componentName.ToLower()) {
        "loop-detector" {
            try {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "status" 2>&1
                if ($result -match "Paused: True") { return "PAUSED" }
                if ($result -match "Loop Detected: True") { return "ERROR" }
                return "ACTIVE"
            } catch {
                return "ERROR"
            }
        }
        
        "agent-queue" {
            try {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "status" 2>&1
                if ($result -match "Paused: True") { return "PAUSED" }
                if ($result -match "Enabled: False") { return "DISABLED" }
                return "ACTIVE"
            } catch {
                return "ERROR"
            }
        }
        
        "stabilization" {
            try {
                $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/stabilization-check.ps1" "quick" 2>&1
                if ($LASTEXITCODE -eq 0) { return "ACTIVE" }
                return "ERROR"
            } catch {
                return "ERROR"
            }
        }
        
        "server" {
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
                if ($response.status -eq "OK") { return "ACTIVE" }
                return "ERROR"
            } catch {
                return "ERROR"
            }
        }
        
        default {
            return "UNKNOWN"
        }
    }
}

switch ($Command.ToLower()) {
    "status" {
        Write-Header "CollisionOS Agent Loop Management Status"
        
        $components = @("server", "loop-detector", "agent-queue", "stabilization")
        
        foreach ($comp in $components) {
            $status = Get-ComponentStatus $comp
            
            switch ($comp) {
                "server" {
                    $details = if ($status -eq "ACTIVE") { "Server responding on port 3001" } else { "Server not responding" }
                    Write-Status "Server Health" $status $details
                }
                "loop-detector" {
                    $details = if ($status -eq "ACTIVE") { "Monitoring restart frequency" } elseif ($status -eq "PAUSED") { "Loop detected - automation paused" } else { "Detection system offline" }
                    Write-Status "Loop Detection" $status $details
                }
                "agent-queue" {
                    $details = if ($status -eq "ACTIVE") { "Processing agent tasks" } elseif ($status -eq "PAUSED") { "Queue processing paused" } else { "Queue system offline" }
                    Write-Status "Agent Queue" $status $details
                }
                "stabilization" {
                    $details = if ($status -eq "ACTIVE") { "Server stability verified" } else { "Stabilization checks failing" }
                    Write-Status "Stabilization" $status $details
                }
            }
        }
        
        # Overall system health
        $allActive = $components | ForEach-Object { Get-ComponentStatus $_ } | Where-Object { $_ -eq "ACTIVE" }
        $overallStatus = if ($allActive.Count -eq $components.Count) { "HEALTHY" } elseif ($allActive.Count -gt ($components.Count / 2)) { "DEGRADED" } else { "CRITICAL" }
        
        Write-Host "`n" -NoNewline
        Write-Status "Overall System" $overallStatus
        
        Write-Host "`nQuick Actions:" -ForegroundColor Cyan
        Write-Host "  loop-manager.ps1 pause     - Pause all automation" -ForegroundColor Gray
        Write-Host "  loop-manager.ps1 resume    - Resume all automation" -ForegroundColor Gray
        Write-Host "  loop-manager.ps1 reset     - Reset all counters" -ForegroundColor Gray
        Write-Host "  loop-manager.ps1 emergency - Emergency stop" -ForegroundColor Gray
        
        exit 0
    }
    
    "pause" {
        Write-Header "Pausing CollisionOS Automation"
        
        Write-Host "⏸️  Pausing loop detector..." -ForegroundColor Yellow
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "pause" | Out-Null
        
        Write-Host "⏸️  Pausing agent queue..." -ForegroundColor Yellow  
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "pause" | Out-Null
        
        Write-Host "✅ All automation paused" -ForegroundColor Green
        Write-Host "Use 'loop-manager.ps1 resume' to restart automation" -ForegroundColor Gray
        exit 0
    }
    
    "resume" {
        Write-Header "Resuming CollisionOS Automation"
        
        Write-Host "▶️  Resuming loop detector..." -ForegroundColor Green
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "resume" | Out-Null
        
        Write-Host "▶️  Resuming agent queue..." -ForegroundColor Green
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "resume" | Out-Null
        
        Write-Host "✅ All automation resumed" -ForegroundColor Green
        exit 0
    }
    
    "reset" {
        Write-Header "Resetting CollisionOS Loop System"
        
        Write-Host "🔄 Cleaning loop detector state..." -ForegroundColor Cyan
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "clean" | Out-Null
        
        Write-Host "🔄 Clearing agent queue..." -ForegroundColor Cyan
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "clear" | Out-Null
        
        Write-Host "🔄 Resuming all systems..." -ForegroundColor Cyan
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "resume" | Out-Null
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "resume" | Out-Null
        
        Write-Host "✅ System reset complete" -ForegroundColor Green
        exit 0
    }
    
    "emergency" {
        Write-Header "EMERGENCY STOP - CollisionOS Automation"
        
        Write-Host "🚨 EMERGENCY STOP ACTIVATED" -ForegroundColor Red
        Write-Host "🛑 Pausing all automation..." -ForegroundColor Red
        
        # Pause everything
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "pause" | Out-Null
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "pause" | Out-Null
        
        # Clear queues
        powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "clear" | Out-Null
        
        Write-Host "🔒 All automation stopped and queues cleared" -ForegroundColor Red
        Write-Host "⚠️  Manual intervention required to resume" -ForegroundColor Yellow
        Write-Host "Use 'loop-manager.ps1 resume' when ready to restart" -ForegroundColor Gray
        exit 0
    }
    
    "monitor" {
        Write-Header "CollisionOS Loop Monitoring (Press Ctrl+C to stop)"
        
        $iteration = 0
        while ($true) {
            $iteration++
            
            Clear-Host
            Write-Host "CollisionOS Loop Monitor - Iteration $iteration" -ForegroundColor Cyan
            Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
            Write-Host "$('=' * 60)" -ForegroundColor Cyan
            
            # Quick status check
            $serverStatus = Get-ComponentStatus "server"
            $loopStatus = Get-ComponentStatus "loop-detector"
            $queueStatus = Get-ComponentStatus "agent-queue"
            
            Write-Status "Server" $serverStatus
            Write-Status "Loop Detector" $loopStatus
            Write-Status "Agent Queue" $queueStatus
            
            # Check for issues
            if ($loopStatus -eq "PAUSED") {
                Write-Host "`n⚠️  LOOP DETECTED - Automation is paused" -ForegroundColor Red
                Write-Host "Run 'loop-manager.ps1 resume' to restart after fixing issues" -ForegroundColor Yellow
            }
            
            if ($serverStatus -eq "ERROR") {
                Write-Host "`n❌ SERVER OFFLINE - Check if server is running" -ForegroundColor Red
            }
            
            Start-Sleep -Seconds 5
        }
    }
    
    "logs" {
        Write-Header "Recent Loop Management Logs"
        
        $stateFiles = @(
            "$projectRoot\.claude\loop-state.json",
            "$projectRoot\.claude\agent-queue.json"
        )
        
        foreach ($file in $stateFiles) {
            if (Test-Path $file) {
                $fileName = Split-Path $file -Leaf
                Write-Host "`n📄 $fileName:" -ForegroundColor Cyan
                
                try {
                    $content = Get-Content $file | ConvertFrom-Json
                    $content | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
                } catch {
                    Write-Host "Error reading file: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        exit 0
    }
    
    "health" {
        Write-Header "CollisionOS System Health Check"
        
        # Comprehensive health check
        $healthChecks = @{
            "Server Response" = { 
                try { 
                    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
                    return $response.status -eq "OK"
                } catch { return $false }
            }
            "Database Connection" = {
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
                    return $response.database.connected -eq $true
                } catch { return $false }
            }
            "Loop Detection Active" = {
                try {
                    $result = powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/hooks/loop-detector.ps1" "status" 2>&1
                    return $result -notmatch "Paused: True"
                } catch { return $false }
            }
            "Agent Queue Available" = {
                try {
                    powershell -NoProfile -ExecutionPolicy Bypass -File "$projectRoot/.claude/agent-queue.ps1" "status" | Out-Null
                    return $LASTEXITCODE -eq 0
                } catch { return $false }
            }
        }
        
        $passedChecks = 0
        $totalChecks = $healthChecks.Count
        
        foreach ($check in $healthChecks.GetEnumerator()) {
            $result = & $check.Value
            $status = if ($result) { "PASS"; $passedChecks++ } else { "FAIL" }
            $color = if ($result) { "Green" } else { "Red" }
            
            Write-Host "$($check.Key.PadRight(25)) [$status]" -ForegroundColor $color
        }
        
        $healthPercentage = [math]::Round(($passedChecks / $totalChecks) * 100)
        Write-Host "`nOverall Health: $healthPercentage% ($passedChecks/$totalChecks)" -ForegroundColor $(if ($healthPercentage -ge 80) { "Green" } elseif ($healthPercentage -ge 60) { "Yellow" } else { "Red" })
        
        exit $(if ($healthPercentage -ge 80) { 0 } else { 1 })
    }
    
    default {
        Write-Header "CollisionOS Loop Manager Help"
        
        Write-Host "Available Commands:" -ForegroundColor Cyan
        Write-Host "  status     - Show current system status" -ForegroundColor White
        Write-Host "  pause      - Pause all automation" -ForegroundColor White
        Write-Host "  resume     - Resume all automation" -ForegroundColor White  
        Write-Host "  reset      - Reset counters and resume" -ForegroundColor White
        Write-Host "  emergency  - Emergency stop all automation" -ForegroundColor White
        Write-Host "  monitor    - Real-time monitoring mode" -ForegroundColor White
        Write-Host "  logs       - View recent logs" -ForegroundColor White
        Write-Host "  health     - Comprehensive health check" -ForegroundColor White
        
        Write-Host "`nQuick Status:" -ForegroundColor Cyan
        $serverStatus = Get-ComponentStatus "server"
        Write-Status "Server" $serverStatus
        
        exit 0
    }
}