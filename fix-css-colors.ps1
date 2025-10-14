# PowerShell script to fix CSS colors
$cssFile = "src\App.css"
$content = Get-Content $cssFile -Raw

# Remove all [data-theme='dark'] blocks
$content = $content -replace "(?ms)/\*[^*]*Dark Mode[^*]*\*/\s*\[data-theme='dark'\][^}]*\{[^}]*\}", ""
$content = $content -replace "(?ms)\[data-theme='dark'\][^\{]*\{[^\}]*\}", ""

# Fix color pairings for dark backgrounds
# These need light text (cream, gold, white)
$content = $content -replace "(?m)^(\s*)(background:\s*var\(--primary-purple)", "`$1`$2"
$content = $content -replace "(?m)^(\s*)(background:\s*var\(--black\))", "`$1`$2"

# Output cleaned file
$content | Set-Content $cssFile

Write-Host "CSS cleaned! Removed dark-theme selectors."
Write-Host "Lines in file: $((Get-Content $cssFile | Measure-Object -Line).Lines)"




