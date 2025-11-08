#!/bin/bash
# Deployment script for server

set -e

VERSION=$(cat VERSION | tr -d '[:space:]')

echo "======================================"
echo "Deploying Werbisci Lublin App"
echo "Version: ${VERSION}"
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
echo "Starting containers with version ${VERSION}..."
export APP_VERSION=${VERSION}
docker compose up -d

echo ""
echo "======================================"
echo "Deployment completed!"
echo "Application version: ${VERSION}"
echo "======================================"

