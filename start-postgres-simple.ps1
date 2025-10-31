# Simple PostgreSQL startup
Write-Host "Starting PostgreSQL..." -ForegroundColor Green

# Start PostgreSQL server
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\17\data" -w

Write-Host "PostgreSQL started!" -ForegroundColor Green
Write-Host "Now try connecting with pgAdmin using:" -ForegroundColor Yellow
Write-Host "Host: localhost" -ForegroundColor Cyan
Write-Host "Port: 5432" -ForegroundColor Cyan
Write-Host "Username: ma_admin" -ForegroundColor Cyan
Write-Host "Password: admin123" -ForegroundColor Cyan