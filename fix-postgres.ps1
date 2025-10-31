# Fix PostgreSQL Authentication - Run as Administrator
Write-Host "Fixing PostgreSQL Authentication..." -ForegroundColor Green

# Stop PostgreSQL service
Write-Host "Stopping PostgreSQL service..."
try {
    Stop-Service -Name "postgresql-x64-17" -Force
    Write-Host "PostgreSQL service stopped." -ForegroundColor Green
} catch {
    Write-Host "Error stopping service: $_" -ForegroundColor Red
    exit 1
}

# Backup and modify pg_hba.conf
$configPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$backupPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"

Write-Host "Modifying authentication config..."
try {
    # Create backup
    Copy-Item $configPath $backupPath -Force
    
    # Read config file
    $content = Get-Content $configPath
    
    # Replace scram-sha-256 with trust for localhost connections
    $newContent = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256", "host    all             all             127.0.0.1/32            trust"
    $newContent = $newContent -replace "host\s+all\s+all\s+::1/128\s+scram-sha-256", "host    all             all             ::1/128                 trust"
    
    # Write modified content
    $newContent | Set-Content $configPath -Encoding UTF8
    Write-Host "Config file modified." -ForegroundColor Green
} catch {
    Write-Host "Error modifying config: $_" -ForegroundColor Red
    exit 1
}

# Start PostgreSQL service
Write-Host "Starting PostgreSQL service..."
try {
    Start-Service -Name "postgresql-x64-17"
    Write-Host "PostgreSQL service started." -ForegroundColor Green
} catch {
    Write-Host "Error starting service: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nPostgreSQL is now configured for passwordless local access." -ForegroundColor Green
Write-Host "You can now connect with: psql -U postgres" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Connect: psql -U postgres"
Write-Host "2. Set password: ALTER USER postgres PASSWORD 'your_password';"
Write-Host "3. Run restore-postgres-security.ps1 to restore security"