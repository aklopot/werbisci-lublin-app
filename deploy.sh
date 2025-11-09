#!/bin/bash
# Deployment script for server

set -e

VERSION=$(cat VERSION | tr -d '[:space:]')

echo "======================================"
echo "Deploying Werbisci Lublin App"
echo "Version: ${VERSION}"
echo "======================================"

# Stop and remove current containers
echo "Stopping and removing current containers..."
docker compose down --remove-orphans

# Pull latest changes
echo "Pulling latest changes from git..."
git pull

# Build with version
echo "Building versioned images..."
./build.sh

# Start with versioned images - force recreate to ensure new version
echo "Starting containers with version ${VERSION}..."
export APP_VERSION=${VERSION}
docker compose up -d --force-recreate --remove-orphans

# Show running containers
echo ""
echo "Running containers:"
docker compose ps

echo ""
echo "======================================"
echo "Deployment completed!"
echo "Application version: ${VERSION}"
echo "======================================"
echo ""
echo "Verify version at: http://localhost:5173/app/info"

