# Automated code review hook for CollisionOS
# Performs security and quality checks

param(
    [string]$FilePath
)

# Handle template variable that wasn't processed
if ($FilePath -like "*{{ .tool_input.file_path }}*") {
    $FilePath = ""
}

$exitCode = 0
$issues = @()

# Read file content
$content = Get-Content $FilePath -Raw

# Security checks
if ($content -match "api[_-]?key\s*=\s*['""][^'""]+['""]" -or 
    $content -match "password\s*=\s*['""][^'""]+['""]" -or
    $content -match "secret\s*=\s*['""][^'""]+['""]") {
    $issues += "CRITICAL: Potential hardcoded credentials detected"
    $exitCode = 2
}

# Check for console.log in production code
if ($FilePath -notlike "*test*" -and $FilePath -notlike "*spec*") {
    if ($content -match "console\.log\(") {
        $issues += "WARNING: console.log found in production code"
    }
}

# Check for proper error handling
if ($content -match "async\s+function|async\s*\(" -and $content -notmatch "try\s*{.*catch") {
    $issues += "WARNING: Async function without try-catch block"
}

# Check for SQL injection vulnerabilities
if ($content -match 'query\([''"].*\$\{.*\}.*[''"]' -or 
    $content -match 'query\(`.*\$\{.*\}.*`\)') {
    $issues += "CRITICAL: Potential SQL injection vulnerability"
    $exitCode = 2
}

# Check for missing input validation
if ($content -match "req\.body\." -or $content -match "req\.params\.") {
    if ($content -notmatch 'if\s*\(\!.*req\.(body|params)') {
        $issues += "WARNING: Missing input validation for request parameters"
    }
}

# Check for unused variables (simple check)
$matches = [regex]::Matches($content, "const\s+(\w+)\s*=")
foreach ($match in $matches) {
    $varName = $match.Groups[1].Value
    $pattern = "\b$varName\b"
    $occurrences = ([regex]::Matches($content, $pattern)).Count
    if ($occurrences -eq 1) {
        $issues += "INFO: Potentially unused variable: $varName"
    }
}

# Check for TODO comments
if ($content -match "//\s*TODO|/\*.*TODO.*\*/") {
    $issues += "INFO: TODO comment found - consider creating a task"
}

# Output results
if ($issues.Count -gt 0) {
    Write-Host "`n=== Code Review Results for $([System.IO.Path]::GetFileName($FilePath)) ===" -ForegroundColor Cyan
    foreach ($issue in $issues) {
        if ($issue -like "CRITICAL:*") {
            Write-Host $issue -ForegroundColor Red
        }
        elseif ($issue -like "WARNING:*") {
            Write-Host $issue -ForegroundColor Yellow
        }
        else {
            Write-Host $issue -ForegroundColor Gray
        }
    }
    Write-Host "==================================================" -ForegroundColor Cyan
}

exit $exitCode