param([string]$FilePath)

# Exit quietly if nothing passed
if ([string]::IsNullOrWhiteSpace($FilePath)) { exit 0 }

# Choose a formatter based on extension
switch -Wildcard ($FilePath) {
  "*.ts" { npm run format --silent; break }
  "*.tsx" { npm run format --silent; break }
  "*.js" { npm run format --silent; break }
  "*.jsx" { npm run format --silent; break }
  "*.json" { npm run format --silent; break }
  "*.css" { npm run format --silent; break }
  "*.md" { npm run format --silent; break }
  default { exit 0 }
}
