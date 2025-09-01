param([string]$FilePath)

# Block edits to secrets or lockfiles
$blocked = @(".env", ".env.local", ".env.prod", ".git\", "secrets\", "package-lock.json", "pnpm-lock.yaml")
foreach ($b in $blocked) {
  if ($FilePath -like "*$b*") { exit 2 }  # non-zero makes the hook fail and block
}
exit 0
