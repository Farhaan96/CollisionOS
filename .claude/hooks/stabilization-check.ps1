# Stabilization Check Hook for CollisionOS
# Ensures server is healthy and stable before continuing with more changes

param(
    [string]$FilePath,
    [string]$Operation = "check",
    [int]$MaxRetries = 10,
    [int]$RetryIntervalMs = 1000
)

# Handle template variable that wasn't processed
if ($FilePath -like "*{{ .tool_input.file_path }}*") {
    $FilePath = ""
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$serverUrl = "http://localhost:3001"

function Test-ServerHealth {
    try {
        $response = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        return $response.status -eq "OK" -and $response.database.connected -eq $true
    } catch {
        return $false
    }
}

function Test-ServerStability {
    param([int]$Checks = 3, [int]$IntervalMs = 1000)
    
    $successCount = 0
    for ($i = 0; $i -lt $Checks; $i++) {
        if (Test-ServerHealth) {
            $successCount++
        } else {
            return $false
        }
        
        if ($i -lt ($Checks - 1)) {
            Start-Sleep -Milliseconds $IntervalMs
        }
    }
    
    return $successCount -eq $Checks
}

function Wait-ForStabilization {
    Write-Host "Checking server stabilization..." -ForegroundColor Cyan
    
    $attempt = 0
    while ($attempt -lt $MaxRetries) {
        $attempt++
        
        if (Test-ServerStability) {
            Write-Host "Server is stable and healthy" -ForegroundColor Green
            
            # Record success in loop detector
            powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/loop-detector.ps1" "success" | Out-Null
            
            return $true
        }
        
        Write-Host "Server not stable yet, attempt $attempt/$MaxRetries" -ForegroundColor Yellow
        
        if ($attempt -lt $MaxRetries) {
            Start-Sleep -Milliseconds $RetryIntervalMs
        }
    }
    
    Write-Host "Server failed to stabilize after $MaxRetries attempts" -ForegroundColor Red
    
    # Record failure in loop detector
    powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/loop-detector.ps1" "failure" | Out-Null
    
    return $false
}

switch ($Operation.ToLower()) {
    "check" {
        if (-not (Wait-ForStabilization)) {
            Write-Host "Server is not stable, blocking further changes" -ForegroundColor Red
            exit 2
        }
        exit 0
    }
    
    "quick" {
        # Quick health check without stability testing
        if (Test-ServerHealth) {
            Write-Host "Server health check passed" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Server health check failed" -ForegroundColor Red
            powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/loop-detector.ps1" "failure" | Out-Null
            exit 1
        }
    }
    
    "wait" {
        # Just wait for stabilization without blocking
        $stable = Wait-ForStabilization
        Write-Host "Server stabilization result: $stable" -ForegroundColor Green
        exit 0
    }
    
    default {
        Write-Host "Usage: stabilization-check.ps1 [check|quick|wait] [file-path]" -ForegroundColor Yellow
        exit 1
    }
}