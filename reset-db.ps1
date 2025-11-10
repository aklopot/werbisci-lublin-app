# Reset Database Script (PowerShell)
# This script completely resets the database and creates a fresh one
# with admin user from environment variables

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "DATABASE RESET SCRIPT" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE all data!" -ForegroundColor Red
Write-Host "⚠️  All users, addresses, and login sessions will be LOST!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? Type 'YES' to confirm"

if ($confirmation -ne "YES") {
    Write-Host "Aborted. No changes made." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting database reset..." -ForegroundColor Green
Write-Host ""

# Stop containers
Write-Host "1. Stopping containers..." -ForegroundColor Yellow
docker compose down

# Remove database file
Write-Host "2. Removing old database file..." -ForegroundColor Yellow
$dbPath = "data\werbisci-app.db"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "   ✓ Database file deleted" -ForegroundColor Green
} else {
    Write-Host "   ℹ Database file not found (will be created fresh)" -ForegroundColor Cyan
}

# Remove SQLite journal files
Remove-Item "data\werbisci-app.db-shm" -ErrorAction SilentlyContinue
Remove-Item "data\werbisci-app.db-wal" -ErrorAction SilentlyContinue

# Start containers (backend will auto-create database on startup)
Write-Host "3. Starting containers..." -ForegroundColor Yellow
docker compose up -d

# Wait for backend to be ready
Write-Host "4. Waiting for backend to initialize (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if database was created
if (Test-Path $dbPath) {
    Write-Host "   ✓ New database created" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Database file not found - check logs" -ForegroundColor Red
}

# Show admin credentials from .env or defaults
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "DATABASE RESET COMPLETE!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Green

# Try to read from .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $adminLogin = ($envContent | Select-String "ADMIN_LOGIN=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }) -replace '[''"]', ''
    $adminPassword = ($envContent | Select-String "ADMIN_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }) -replace '[''"]', ''
    
    if ($adminLogin) {
        Write-Host "  Login:    $adminLogin" -ForegroundColor White
    } else {
        Write-Host "  Login:    admin" -ForegroundColor White
    }
    
    if ($adminPassword) {
        Write-Host "  Password: $adminPassword" -ForegroundColor White
    } else {
        Write-Host "  Password: admin123" -ForegroundColor White
    }
} else {
    Write-Host "  Login:    admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host "  (defaults - no .env file found)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Check backend logs:" -ForegroundColor Yellow
Write-Host "  docker compose logs backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Verify tables created:" -ForegroundColor Yellow
Write-Host "  docker compose exec backend sqlite3 /data/werbisci-app.db '.tables'" -ForegroundColor Gray
Write-Host ""

# Show logs to verify admin was created
Write-Host "Recent backend logs:" -ForegroundColor Yellow
docker compose logs backend --tail=20

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "You can now log in to the application" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

