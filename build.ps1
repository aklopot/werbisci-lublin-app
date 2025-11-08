# PowerShell build script for versioned Docker images

$ErrorActionPreference = "Stop"

# Read version from VERSION file
$VERSION = (Get-Content VERSION -Raw).Trim()
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "======================================"
Write-Host "Building Werbisci Lublin App"
Write-Host "======================================"
Write-Host "Version: ${VERSION}"
Write-Host "Build Date: ${BUILD_DATE}"
Write-Host "======================================"

# Generate version.json for backend
$backendVersionJson = @{
    version = $VERSION
    buildDate = $BUILD_DATE
} | ConvertTo-Json

Set-Content -Path "backend/app/version.json" -Value $backendVersionJson

# Generate version.json for frontend
$frontendVersionJson = @{
    version = $VERSION
    buildDate = $BUILD_DATE
} | ConvertTo-Json

Set-Content -Path "frontend/public/version.json" -Value $frontendVersionJson

# Build Docker images with single version tag
Write-Host ""
Write-Host "Building backend image..."
docker build -t werbisci-lublin-backend:${VERSION} `
             --build-arg VERSION=${VERSION} `
             --build-arg BUILD_DATE=${BUILD_DATE} `
             ./backend

Write-Host ""
Write-Host "Building frontend image..."
docker build -t werbisci-lublin-frontend:${VERSION} `
             --build-arg VERSION=${VERSION} `
             --build-arg BUILD_DATE=${BUILD_DATE} `
             ./frontend

Write-Host ""
Write-Host "======================================"
Write-Host "Build completed successfully!"
Write-Host "======================================"
Write-Host "Images tagged as:"
Write-Host "  - werbisci-lublin-backend:${VERSION}"
Write-Host "  - werbisci-lublin-frontend:${VERSION}"
Write-Host "======================================"

