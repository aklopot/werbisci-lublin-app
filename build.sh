#!/bin/bash
# Build script for versioned Docker images

set -e

# Read version from VERSION file
VERSION=$(cat VERSION | tr -d '[:space:]')
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "======================================"
echo "Building Werbisci Lublin App"
echo "======================================"
echo "Version: ${VERSION}"
echo "Build Date: ${BUILD_DATE}"
echo "======================================"

# Generate version.json for backend
cat > backend/app/version.json <<EOF
{
  "version": "${VERSION}",
  "buildDate": "${BUILD_DATE}"
}
EOF

# Generate version.json for frontend
cat > frontend/public/version.json <<EOF
{
  "version": "${VERSION}",
  "buildDate": "${BUILD_DATE}"
}
EOF

# Build Docker images with single version tag
echo ""
echo "Building backend image..."
docker build -t werbisci-lublin-backend:${VERSION} \
             --build-arg VERSION=${VERSION} \
             --build-arg BUILD_DATE=${BUILD_DATE} \
             ./backend

echo ""
echo "Building frontend image..."
docker build -t werbisci-lublin-frontend:${VERSION} \
             --build-arg VERSION=${VERSION} \
             --build-arg BUILD_DATE=${BUILD_DATE} \
             ./frontend

echo ""
echo "======================================"
echo "Build completed successfully!"
echo "======================================"
echo "Images tagged as:"
echo "  - werbisci-lublin-backend:${VERSION}"
echo "  - werbisci-lublin-frontend:${VERSION}"
echo "======================================"

