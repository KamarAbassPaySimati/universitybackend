# Restart PostgreSQL and create tables
Write-Host "Restarting PostgreSQL and creating tables..." -ForegroundColor Green

# Start PostgreSQL server
Write-Host "Starting PostgreSQL server..."
$pgCtl = "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe"
$dataDir = "C:\Program Files\PostgreSQL\17\data"

& $pgCtl start -D $dataDir -l "$dataDir\server.log"
Start-Sleep -Seconds 5

# Create tables
Write-Host "Creating database tables..."
$env:PGPASSWORD = "admin123"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U ma_admin -d university_db -f "create-tables.sql"
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "Setup completed!" -ForegroundColor Green