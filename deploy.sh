#!/bin/bash
# Deployment script for server

set -e

# Pull latest changes first
echo "Pulling latest changes from git..."
git pull

# Read version from VERSION file
VERSION=$(cat VERSION | tr -d '[:space:]')

echo "======================================"
echo "Deploying Werbisci Lublin App"
echo "Version: ${VERSION}"
echo "======================================"
echo ""

# Check if containers are running and get current version
RUNNING_VERSION=""
if docker compose ps -q backend > /dev/null 2>&1; then
    # Try to get version from running container
    RUNNING_VERSION=$(docker inspect $(docker compose ps -q backend 2>/dev/null | head -n1) --format='{{index .Config.Labels "version"}}' 2>/dev/null || echo "")
fi

# Version check
if [ ! -z "$RUNNING_VERSION" ] && [ "$RUNNING_VERSION" = "$VERSION" ]; then
    echo "❌ ERROR: Version conflict detected!"
    echo ""
    echo "Current running version: $RUNNING_VERSION"
    echo "Version in VERSION file: $VERSION"
    echo ""
    echo "You are trying to deploy the SAME version that is currently running."
    echo ""
    echo "Please update the VERSION file before deploying:"
    echo "  1. Edit VERSION file and increment the version number"
    echo "  2. Example: 0.6.0 → 0.6.1 (patch) or 0.7.0 (minor) or 1.0.0 (major)"
    echo "  3. Commit the change: git add VERSION && git commit -m 'Bump version to X.Y.Z'"
    echo "  4. Push: git push"
    echo "  5. Run deploy.sh again"
    echo ""
    echo "======================================"
    exit 1
fi

if [ ! -z "$RUNNING_VERSION" ]; then
    echo "✓ Version check passed"
    echo "  Current version: $RUNNING_VERSION"
    echo "  New version:     $VERSION"
    echo ""
fi

# Stop and remove current containers
echo "Stopping and removing current containers..."
docker compose down --remove-orphans

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

