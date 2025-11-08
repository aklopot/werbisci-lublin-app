# PowerShell deployment script for server

$ErrorActionPreference = "Stop"

$VERSION = (Get-Content VERSION -Raw).Trim()

Write-Host "======================================"
Write-Host "Deploying Werbisci Lublin App"
Write-Host "Version: ${VERSION}"
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
Write-Host "Starting containers with version ${VERSION}..."
$env:APP_VERSION = $VERSION
docker compose up -d

Write-Host ""
Write-Host "======================================"
Write-Host "Deployment completed!"
Write-Host "Application version: ${VERSION}"
Write-Host "======================================"

