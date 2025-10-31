# Start PostgreSQL manually
Write-Host "Starting PostgreSQL server..." -ForegroundColor Green

# Try to start PostgreSQL server directly
$pgCtl = "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe"
$dataDir = "C:\Program Files\PostgreSQL\17\data"

if (Test-Path $pgCtl) {
    Write-Host "Starting PostgreSQL with pg_ctl..."
    & $pgCtl start -D $dataDir -l "C:\Program Files\PostgreSQL\17\data\server.log"
    
    Start-Sleep -Seconds 3
    
    # Test connection
    Write-Host "Testing connection..."
    $env:PGPASSWORD = "admin123"
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "SELECT 'PostgreSQL is running!' as status;"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
} else {
    Write-Host "PostgreSQL not found at expected location" -ForegroundColor Red
}