#!/bin/bash
# Build script for versioned Docker images

set -e

# Read version from VERSION file
VERSION=$(cat VERSION | tr -d '[:space:]')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create version info
VERSION_TAG="${VERSION}"
VERSION_COMMIT_TAG="${VERSION}-${GIT_COMMIT}"

echo "======================================"
echo "Building Werbisci Lublin App"
echo "======================================"
echo "Version: ${VERSION}"
echo "Git Commit: ${GIT_COMMIT}"
echo "Build Date: ${BUILD_DATE}"
echo "======================================"

# Generate version.json for backend
cat > backend/app/version.json <<EOF
{
  "version": "${VERSION}",
  "commit": "${GIT_COMMIT}",
  "buildDate": "${BUILD_DATE}"
}
EOF

# Generate version.json for frontend
cat > frontend/public/version.json <<EOF
{
  "version": "${VERSION}",
  "commit": "${GIT_COMMIT}",
  "buildDate": "${BUILD_DATE}"
}
EOF

# Build Docker images with version tags
echo ""
echo "Building backend image..."
docker build -t werbisci-lublin-backend:${VERSION_TAG} \
             -t werbisci-lublin-backend:${VERSION_COMMIT_TAG} \
             -t werbisci-lublin-backend:latest \
             --build-arg VERSION=${VERSION} \
             --build-arg GIT_COMMIT=${GIT_COMMIT} \
             --build-arg BUILD_DATE=${BUILD_DATE} \
             ./backend

echo ""
echo "Building frontend image..."
docker build -t werbisci-lublin-frontend:${VERSION_TAG} \
             -t werbisci-lublin-frontend:${VERSION_COMMIT_TAG} \
             -t werbisci-lublin-frontend:latest \
             --build-arg VERSION=${VERSION} \
             --build-arg GIT_COMMIT=${GIT_COMMIT} \
             --build-arg BUILD_DATE=${BUILD_DATE} \
             ./frontend

echo ""
echo "======================================"
echo "Build completed successfully!"
echo "======================================"
echo "Images tagged as:"
echo "  - werbisci-lublin-backend:${VERSION_TAG}"
echo "  - werbisci-lublin-backend:${VERSION_COMMIT_TAG}"
echo "  - werbisci-lublin-frontend:${VERSION_TAG}"
echo "  - werbisci-lublin-frontend:${VERSION_COMMIT_TAG}"
echo "======================================"

