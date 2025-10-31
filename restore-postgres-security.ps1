# Restore PostgreSQL Security - Run as Administrator
Write-Host "Restoring PostgreSQL Security..." -ForegroundColor Green

# Stop PostgreSQL service
Write-Host "Stopping PostgreSQL service..."
try {
    Stop-Service -Name "postgresql-x64-17" -Force
    Write-Host "PostgreSQL service stopped." -ForegroundColor Green
} catch {
    Write-Host "Error stopping service: $_" -ForegroundColor Red
    exit 1
}

# Restore pg_hba.conf from backup
$configPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$backupPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"

Write-Host "Restoring authentication config..."
try {
    if (Test-Path $backupPath) {
        Copy-Item $backupPath $configPath -Force
        Write-Host "Config file restored from backup." -ForegroundColor Green
    } else {
        # Manually restore security
        $content = Get-Content $configPath
        $newContent = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+trust", "host    all             all             127.0.0.1/32            scram-sha-256"
        $newContent = $newContent -replace "host\s+all\s+all\s+::1/128\s+trust", "host    all             all             ::1/128                 scram-sha-256"
        $newContent | Set-Content $configPath -Encoding UTF8
        Write-Host "Config file security restored manually." -ForegroundColor Green
    }
} catch {
    Write-Host "Error restoring config: $_" -ForegroundColor Red
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

Write-Host "`nPostgreSQL security has been restored." -ForegroundColor Green
Write-Host "You now need a password to connect." -ForegroundColor Yellow