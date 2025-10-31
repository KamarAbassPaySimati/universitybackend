# Fix PostgreSQL Service - Run as Administrator
Write-Host "Fixing PostgreSQL service..." -ForegroundColor Green

# Check service status
Write-Host "Checking PostgreSQL service status..."
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service found: $($service.Name) - Status: $($service.Status)" -ForegroundColor Yellow
} else {
    Write-Host "No PostgreSQL service found" -ForegroundColor Red
}

# Find PostgreSQL installation
$pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
if ($pgPath) {
    Write-Host "PostgreSQL found at: $($pgPath.FullName)" -ForegroundColor Green
    
    $binPath = Join-Path $pgPath.FullName "bin"
    $dataPath = Join-Path $pgPath.FullName "data"
    
    # Check if data directory exists and is initialized
    if (!(Test-Path $dataPath) -or !(Test-Path (Join-Path $dataPath "postgresql.conf"))) {
        Write-Host "Initializing PostgreSQL database..." -ForegroundColor Cyan
        
        # Initialize database
        $initdb = Join-Path $binPath "initdb.exe"
        if (Test-Path $initdb) {
            & $initdb -D $dataPath -U postgres --pwprompt --auth-local=trust --auth-host=md5
        }
    }
    
    # Try to start PostgreSQL manually
    Write-Host "Starting PostgreSQL server..." -ForegroundColor Cyan
    $pgCtl = Join-Path $binPath "pg_ctl.exe"
    if (Test-Path $pgCtl) {
        & $pgCtl start -D $dataPath -l (Join-Path $dataPath "server.log")
        Start-Sleep -Seconds 5
        
        # Test connection
        Write-Host "Testing connection..." -ForegroundColor Cyan
        $psql = Join-Path $binPath "psql.exe"
        if (Test-Path $psql) {
            & $psql -U postgres -c "SELECT 'PostgreSQL is running!' as status;"
        }
    }
} else {
    Write-Host "PostgreSQL installation not found" -ForegroundColor Red
}