#!/bin/bash
# Reset Database Script
# This script completely resets the database and creates a fresh one
# with admin user from environment variables

set -e

echo "======================================"
echo "DATABASE RESET SCRIPT"
echo "======================================"
echo ""
echo "⚠️  WARNING: This will DELETE all data!"
echo "⚠️  All users, addresses, and login sessions will be LOST!"
echo ""
read -p "Are you sure you want to continue? Type 'YES' to confirm: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "Aborted. No changes made."
    exit 0
fi

echo ""
echo "Starting database reset..."
echo ""

# Stop containers
echo "1. Stopping containers..."
docker compose down

# Remove database file
echo "2. Removing old database file..."
if [ -f "data/werbisci-app.db" ]; then
    rm -f data/werbisci-app.db
    echo "   ✓ Database file deleted"
else
    echo "   ℹ Database file not found (will be created fresh)"
fi

# Optional: Remove SQLite journal files
rm -f data/werbisci-app.db-shm data/werbisci-app.db-wal 2>/dev/null || true

# Start containers (backend will auto-create database on startup)
echo "3. Starting containers..."
docker compose up -d

# Wait for backend to be ready
echo "4. Waiting for backend to initialize (10 seconds)..."
sleep 10

# Check if database was created
if [ -f "data/werbisci-app.db" ]; then
    echo "   ✓ New database created"
else
    echo "   ⚠ Database file not found - check logs"
fi

# Show admin credentials - ALWAYS use defaults unless .env is loaded by docker-compose
echo ""
echo "======================================"
echo "DATABASE RESET COMPLETE!"
echo "======================================"
echo ""
echo "⚠️  IMPORTANT: Default credentials"
echo ""
echo "Admin credentials:"
echo "  Login:    admin"
echo "  Password: admin123"
echo ""
echo "Note: .env file is NOT read by backend by default."
echo "To use custom credentials, set them in docker-compose.yml:"
echo "  environment:"
echo "    - ADMIN_LOGIN=your-login"
echo "    - ADMIN_PASSWORD=your-password"

echo ""
echo "Check backend logs:"
echo "  docker compose logs backend"
echo ""
echo "Verify tables created:"
echo "  docker compose exec backend sqlite3 /data/werbisci-app.db '.tables'"
echo ""

# Show logs to verify admin was created
echo "Recent backend logs:"
docker compose logs backend --tail=20 | grep -E "(Initializing|admin|Created)" || echo "(no matching logs)"

echo ""
echo "======================================"
echo "You can now log in to the application"
echo "======================================"

