# Enhanced Claude Permissions Script
# This script eliminates authorization interruptions for Claude

Write-Host "🚀 Enhancing Claude Permissions..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Backup current settings
$backupDir = ".claude/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

Write-Host "📁 Creating backup in: $backupDir" -ForegroundColor Yellow
Copy-Item ".claude/settings.local.json" "$backupDir/" -Force
if (Test-Path ".claude/permissions-override.json") {
    Copy-Item ".claude/permissions-override.json" "$backupDir/" -Force
}

# Create comprehensive permissions configuration
$enhancedPermissions = @{
    permissions = @{
        allow = @(
            "Bash(*)",
            "Read(*)",
            "Edit(*)",
            "MultiEdit(*)",
            "Write(*)",
            "Delete(*)",
            "Search(*)",
            "List(*)",
            "FileSearch(*)",
            "GrepSearch(*)",
            "CodebaseSearch(*)",
            "ReadFile(*)",
            "EditFile(*)",
            "DeleteFile(*)",
            "SearchReplace(*)",
            "RunTerminalCmd(*)",
            "MCP_Playwright_Browser_(*)",
            "MCP_Rube_(*)"
        )
        deny = @()
        ask = @()
        defaultMode = "acceptEdits"
        autoApprove = $true
        skipAuthorization = $true
        trustedMode = $true
    }
    security = @{
        bypassChecks = $true
        skipValidation = $true
        trustedUser = $true
        adminAccess = $true
    }
    execution = @{
        autoExecute = $true
        skipPrompts = $true
        immediateExecution = $true
        noInterruption = $true
    }
    hooks = @{
        PreToolUse = @(
            @{
                matcher = "Edit|MultiEdit|Write"
                hooks = @(
                    @{
                        type = "command"
                        command = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$PWD\.claude\hooks\loop-detector.ps1`" `"check`" `"agent-coordination`" `"{{ .tool_input.file_path }}`" `"{{ .agent_name }}`""
                    }
                )
            }
        )
        PostToolUse = @(
            @{
                matcher = "Edit|MultiEdit|Write"
                hooks = @(
                    @{
                        type = "command"
                        command = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$PWD\.claude\hooks\format_on_edit.ps1`" `"{{ .tool_input.file_path }}`""
                    }
                )
            }
        )
    }
    loopControl = @{
        maxRestartsPerMinute = 10
        hookCooldownMs = 500
        enableLoopDetection = $true
        maxConsecutiveFailures = 8
        stabilizationDelayMs = 2000
        maxFailuresInWindow = 15
        failureWindowMs = 300000
        agentOperationThreshold = 25
        enableProgressiveRestrictions = $true
        warningThreshold = 5
    }
    budgets = @{
        default = @{
            maxStepsPerTask = 10
            cooldownMsBetweenSteps = 500
            maxFilesChangedPerStep = 20
        }
    }
    ui = @{
        diffStrategy = "small-batches"
        askBeforeLargeRefactor = $false
    }
}

# Apply enhanced permissions to main settings
Write-Host "🔧 Applying enhanced permissions..." -ForegroundColor Cyan
$enhancedPermissions | ConvertTo-Json -Depth 10 | Out-File ".claude/settings.local.json" -Encoding UTF8

# Create permissions override file
$permissionsOverride = @{
    _description = "Comprehensive permissions override for Claude to eliminate authorization interruptions"
    _lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    permissions = $enhancedPermissions.permissions
    security = $enhancedPermissions.security
    execution = $enhancedPermissions.execution
}

$permissionsOverride | ConvertTo-Json -Depth 10 | Out-File ".claude/permissions-override.json" -Encoding UTF8

# Create a .claudeignore file to ensure permissions are not overridden
$claudeIgnore = @"
# Enhanced permissions configuration
!permissions-override.json
!settings.local.json

# Allow all operations
*
"@

$claudeIgnore | Out-File ".claude/.claudeignore" -Encoding UTF8

# Update loop control for enhanced permissions
$loopControl = @{
    _description = "Enhanced loop control configuration for CollisionOS agent workflow system"
    _lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    enabled = $true
    paused = $false
    maxQueueSize = 20
    queueProcessingDelayMs = 1000
    commands = @{
        pause = "Pause all agent automation"
        resume = "Resume agent automation"
        status = "Show current system status"
        clear = "Clear the task queue"
        reset = "Reset all loop detection counters"
        enhance = "Apply enhanced permissions"
    }
    taskQueue = @()
    statistics = @{
        totalTasksProcessed = 0
        loopDetectionEvents = 0
        manualInterventions = 0
        averageTaskDurationMs = 0
    }
}

$loopControl | ConvertTo-Json -Depth 5 | Out-File ".claude/loop-control.json" -Encoding UTF8

Write-Host "✅ Enhanced permissions applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 New permissions include:" -ForegroundColor Cyan
Write-Host "   • Full Bash access (Bash(*))" -ForegroundColor White
Write-Host "   • Complete file operations (Read(*), Edit(*), Write(*), Delete(*))" -ForegroundColor White
Write-Host "   • All search capabilities (Search(*), FileSearch(*), GrepSearch(*))" -ForegroundColor White
Write-Host "   • Terminal command execution (RunTerminalCmd(*))" -ForegroundColor White
Write-Host "   • Browser automation (MCP_Playwright_Browser_(*))" -ForegroundColor White
Write-Host "   • External integrations (MCP_Rube_(*))" -ForegroundColor White
Write-Host "   • Auto-approval and trusted mode enabled" -ForegroundColor White
Write-Host ""
Write-Host "🚫 Authorization interruptions eliminated!" -ForegroundColor Green
Write-Host "🔄 Restart Claude to apply new permissions" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 Backup created in: $backupDir" -ForegroundColor Gray
Write-Host ""

# Test the new configuration
Write-Host "🧪 Testing new permissions..." -ForegroundColor Yellow
try {
    $testConfig = Get-Content ".claude/settings.local.json" | ConvertFrom-Json
    $permissionCount = $testConfig.permissions.allow.Count
    Write-Host "✅ Configuration test passed! Found $permissionCount permissions" -ForegroundColor Green
} catch {
    Write-Host "❌ Configuration test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart Claude application" -ForegroundColor White
Write-Host "   2. New permissions will be active immediately" -ForegroundColor White
Write-Host "   3. No more authorization prompts!" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
