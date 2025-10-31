# Install pgAdmin 4
Write-Host "Installing pgAdmin 4..." -ForegroundColor Green

# Install pgAdmin using Chocolatey
choco install pgadmin4 -y

Write-Host "pgAdmin 4 installed!" -ForegroundColor Green
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "1. Open pgAdmin 4 from Start Menu" -ForegroundColor Yellow
Write-Host "2. Create server connection:" -ForegroundColor Yellow
Write-Host "   - Host: localhost" -ForegroundColor Cyan
Write-Host "   - Port: 5432" -ForegroundColor Cyan
Write-Host "   - Database: university_db" -ForegroundColor Cyan
Write-Host "   - Username: ma_admin" -ForegroundColor Cyan
Write-Host "   - Password: admin123" -ForegroundColor Cyan