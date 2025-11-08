# Generate version.json files for development in Cursor
# This script is called before starting the dev servers

$VERSION = (Get-Content "$PSScriptRoot/../VERSION" -Raw).Trim()
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Generate version.json for backend
$backendVersionJson = @{
    version = $VERSION
    buildDate = $BUILD_DATE
} | ConvertTo-Json

$backendPath = "$PSScriptRoot/../backend/app/version.json"
Set-Content -Path $backendPath -Value $backendVersionJson

# Generate version.json for frontend
$frontendVersionJson = @{
    version = $VERSION
    buildDate = $BUILD_DATE
} | ConvertTo-Json

$frontendPath = "$PSScriptRoot/../frontend/public/version.json"
Set-Content -Path $frontendPath -Value $frontendVersionJson

Write-Host "Generated version files for development (v$VERSION)" -ForegroundColor Green

