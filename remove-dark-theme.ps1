# PowerShell script to remove all [data-theme='dark'] selectors
$cssFile = "src\App.css"
$content = Get-Content $cssFile -Raw

# Pattern to match [data-theme='dark'] blocks
# This matches from [data-theme='dark'] to the closing brace
$pattern = '(?ms)\[data-theme=.dark.\][^\{]*\{(?:[^\{\}]|\{[^\{\}]*\})*\}'

# Remove all matches
$cleaned = $content -replace $pattern, ''

# Also remove any leftover empty comment blocks
$cleaned = $cleaned -replace '(?ms)/\*\s*\*/', ''

# Remove multiple consecutive newlines (more than 2)
$cleaned = $cleaned -replace '(?ms)\n{3,}', "`n`n"

# Save the cleaned file
$cleaned | Set-Content $cssFile -NoNewline

Write-Host "Removed all [data-theme='dark'] selectors!"
Write-Host "Checking remaining count..."
$remaining = (Get-Content $cssFile | Select-String -Pattern '\[data-theme' | Measure-Object).Count
Write-Host "Remaining [data-theme selectors: $remaining"




