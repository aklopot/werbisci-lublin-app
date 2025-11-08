#!/bin/bash
# Deployment script for server

set -e

VERSION=$(cat VERSION | tr -d '[:space:]')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION_COMMIT_TAG="${VERSION}-${GIT_COMMIT}"

echo "======================================"
echo "Deploying Werbisci Lublin App"
echo "Version: ${VERSION_COMMIT_TAG}"
echo "======================================"

# Stop current containers
echo "Stopping current containers..."
docker compose down

# Pull latest changes
echo "Pulling latest changes from git..."
git pull

# Build with version
echo "Building versioned images..."
./build.sh

# Start with versioned images
echo "Starting containers with version ${VERSION_COMMIT_TAG}..."
export APP_VERSION=${VERSION_COMMIT_TAG}
docker compose up -d

echo ""
echo "======================================"
echo "Deployment completed!"
echo "Application version: ${VERSION_COMMIT_TAG}"
echo "======================================"

