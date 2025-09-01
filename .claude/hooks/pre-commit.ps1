# Pre-commit hook for CollisionOS
# Runs before any code is committed to ensure quality

param(
    [string[]]$Files
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

Write-Host "Running pre-commit checks..." -ForegroundColor Cyan

$hasErrors = $false

# Run ESLint on JavaScript files
$jsFiles = $Files | Where-Object { $_ -match "\.(js|jsx)$" }
if ($jsFiles) {
    Write-Host "Running ESLint..." -ForegroundColor Yellow
    npx eslint $jsFiles --fix
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ESLint found errors that couldn't be auto-fixed" -ForegroundColor Red
        $hasErrors = $true
    }
}

# Run Prettier
Write-Host "Running Prettier..." -ForegroundColor Yellow
npx prettier --write $Files 2>&1 | Out-Null

# Check for large files
foreach ($file in $Files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1MB
        if ($size -gt 1) {
            Write-Host "WARNING: $file is larger than 1MB ($([math]::Round($size, 2))MB)" -ForegroundColor Yellow
        }
    }
}

# Check for merge conflicts
foreach ($file in $Files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "<<<<<<<|>>>>>>>|=======") {
            Write-Host "ERROR: Merge conflict markers found in $file" -ForegroundColor Red
            $hasErrors = $true
        }
    }
}

# Run type checking for TypeScript files
$tsFiles = $Files | Where-Object { $_ -match "\.(ts|tsx)$" }
if ($tsFiles) {
    Write-Host "Running TypeScript type check..." -ForegroundColor Yellow
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "TypeScript type errors found" -ForegroundColor Red
        $hasErrors = $true
    }
}

if ($hasErrors) {
    Write-Host "`nPre-commit checks failed! Please fix errors before committing." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "`nAll pre-commit checks passed!" -ForegroundColor Green
    exit 0
}