# Auto-test hook for CollisionOS
# Runs relevant tests after code changes

param(
    [string]$FilePath
)

# Handle template variable that wasn't processed
if ($FilePath -like "*{{ .tool_input.file_path }}*") {
    $FilePath = ""
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

# Determine test type based on file path
if ($FilePath -like "*test*" -or $FilePath -like "*spec*") {
    Write-Host "Test file modified, skipping auto-test" -ForegroundColor Yellow
    exit 0
}

# Check if it's a source file
if ($FilePath -like "*.js" -or $FilePath -like "*.jsx") {
    $testFile = $null
    
    # Find corresponding test file
    if ($FilePath -like "*src/components/*") {
        $componentName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
        $testFile = $FilePath -replace "\.jsx?$", ".test.js"
    }
    elseif ($FilePath -like "*src/services/*") {
        $testFile = $FilePath -replace "\.js$", ".test.js"
    }
    elseif ($FilePath -like "*server/*") {
        $testFile = $FilePath -replace "\.js$", ".test.js"
    }
    
    # Run test if found
    if ($testFile -and (Test-Path $testFile)) {
        Write-Host "Running tests for $FilePath" -ForegroundColor Green
        npm test -- $testFile --watchAll=false 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Tests failed! Please fix before continuing." -ForegroundColor Red
            exit 2  # Block further operations
        }
    }
    else {
        Write-Host "No test file found for $FilePath" -ForegroundColor Yellow
    }
}

exit 0