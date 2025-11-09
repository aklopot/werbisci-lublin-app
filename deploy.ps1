# PowerShell deployment script for server

$ErrorActionPreference = "Stop"

$VERSION = (Get-Content VERSION -Raw).Trim()

Write-Host "======================================"
Write-Host "Deploying Werbisci Lublin App"
Write-Host "Version: ${VERSION}"
Write-Host "======================================"

# Stop and remove current containers
Write-Host "Stopping and removing current containers..."
docker compose down --remove-orphans

# Pull latest changes
Write-Host "Pulling latest changes from git..."
git pull

# Build with version
Write-Host "Building versioned images..."
.\build.ps1

# Start with versioned images - force recreate to ensure new version
Write-Host "Starting containers with version ${VERSION}..."
$env:APP_VERSION = $VERSION
docker compose up -d --force-recreate --remove-orphans

# Show running containers
Write-Host ""
Write-Host "Running containers:"
docker compose ps

Write-Host ""
Write-Host "======================================"
Write-Host "Deployment completed!"
Write-Host "Application version: ${VERSION}"
Write-Host "======================================"
Write-Host ""
Write-Host "Verify version at: http://localhost:5173/app/info"

