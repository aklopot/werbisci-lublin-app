# PowerShell build script for versioned Docker images

$ErrorActionPreference = "Stop"

# Read version from VERSION file
$VERSION = (Get-Content VERSION -Raw).Trim()
try {
    $GIT_COMMIT = (git rev-parse --short HEAD 2>$null)
} catch {
    $GIT_COMMIT = "unknown"
}
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Create version tags
$VERSION_TAG = $VERSION
$VERSION_COMMIT_TAG = "${VERSION}-${GIT_COMMIT}"

Write-Host "======================================"
Write-Host "Building Werbisci Lublin App"
Write-Host "======================================"
Write-Host "Version: ${VERSION}"
Write-Host "Git Commit: ${GIT_COMMIT}"
Write-Host "Build Date: ${BUILD_DATE}"
Write-Host "======================================"

# Generate version.json for backend
$backendVersionJson = @{
    version = $VERSION
    commit = $GIT_COMMIT
    buildDate = $BUILD_DATE
} | ConvertTo-Json

Set-Content -Path "backend/app/version.json" -Value $backendVersionJson

# Generate version.json for frontend
$frontendVersionJson = @{
    version = $VERSION
    commit = $GIT_COMMIT
    buildDate = $BUILD_DATE
} | ConvertTo-Json

Set-Content -Path "frontend/public/version.json" -Value $frontendVersionJson

# Build Docker images with version tags
Write-Host ""
Write-Host "Building backend image..."
docker build -t werbisci-lublin-backend:${VERSION_TAG} `
             -t werbisci-lublin-backend:${VERSION_COMMIT_TAG} `
             -t werbisci-lublin-backend:latest `
             --build-arg VERSION=${VERSION} `
             --build-arg GIT_COMMIT=${GIT_COMMIT} `
             --build-arg BUILD_DATE=${BUILD_DATE} `
             ./backend

Write-Host ""
Write-Host "Building frontend image..."
docker build -t werbisci-lublin-frontend:${VERSION_TAG} `
             -t werbisci-lublin-frontend:${VERSION_COMMIT_TAG} `
             -t werbisci-lublin-frontend:latest `
             --build-arg VERSION=${VERSION} `
             --build-arg GIT_COMMIT=${GIT_COMMIT} `
             --build-arg BUILD_DATE=${BUILD_DATE} `
             ./frontend

Write-Host ""
Write-Host "======================================"
Write-Host "Build completed successfully!"
Write-Host "======================================"
Write-Host "Images tagged as:"
Write-Host "  - werbisci-lublin-backend:${VERSION_TAG}"
Write-Host "  - werbisci-lublin-backend:${VERSION_COMMIT_TAG}"
Write-Host "  - werbisci-lublin-frontend:${VERSION_TAG}"
Write-Host "  - werbisci-lublin-frontend:${VERSION_COMMIT_TAG}"
Write-Host "======================================"

