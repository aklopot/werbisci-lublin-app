# PowerShell deployment script for server

$ErrorActionPreference = "Stop"

$VERSION = (Get-Content VERSION -Raw).Trim()
try {
    $GIT_COMMIT = (git rev-parse --short HEAD 2>$null)
} catch {
    $GIT_COMMIT = "unknown"
}
$VERSION_COMMIT_TAG = "${VERSION}-${GIT_COMMIT}"

Write-Host "======================================"
Write-Host "Deploying Werbisci Lublin App"
Write-Host "Version: ${VERSION_COMMIT_TAG}"
Write-Host "======================================"

# Stop current containers
Write-Host "Stopping current containers..."
docker compose down

# Pull latest changes
Write-Host "Pulling latest changes from git..."
git pull

# Build with version
Write-Host "Building versioned images..."
.\build.ps1

# Start with versioned images
Write-Host "Starting containers with version ${VERSION_COMMIT_TAG}..."
$env:APP_VERSION = $VERSION_COMMIT_TAG
docker compose up -d

Write-Host ""
Write-Host "======================================"
Write-Host "Deployment completed!"
Write-Host "Application version: ${VERSION_COMMIT_TAG}"
Write-Host "======================================"

