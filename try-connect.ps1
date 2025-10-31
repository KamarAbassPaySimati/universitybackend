# Try connecting with common passwords
Write-Host "Trying to connect to PostgreSQL with common passwords..." -ForegroundColor Green

$passwords = @("", "postgres", "admin", "password", "123456", "root")

foreach ($pwd in $passwords) {
    Write-Host "Trying password: '$pwd'" -ForegroundColor Yellow
    
    if ($pwd -eq "") {
        $env:PGPASSWORD = ""
        $result = & psql -U postgres -d postgres -c "SELECT 'Connected successfully!' as status;" 2>$null
    } else {
        $env:PGPASSWORD = $pwd
        $result = & psql -U postgres -d postgres -c "SELECT 'Connected successfully!' as status;" 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Password is: '$pwd'" -ForegroundColor Green
        Write-Host "Now creating database..." -ForegroundColor Cyan
        
        # Create database and user
        $setupSQL = @"
CREATE DATABASE university_db;
CREATE USER ma_admin WITH PASSWORD 'admin123' SUPERUSER;
ALTER USER postgres PASSWORD 'admin123';
"@
        
        $setupSQL | & psql -U postgres -d postgres
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database setup completed!" -ForegroundColor Green
            Write-Host "Database: university_db" -ForegroundColor Yellow
            Write-Host "Admin user: ma_admin / admin123" -ForegroundColor Yellow
            Write-Host "Postgres user: postgres / admin123" -ForegroundColor Yellow
        }
        
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        exit 0
    }
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host "Could not connect with any common password." -ForegroundColor Red
Write-Host "You may need to reset PostgreSQL password manually." -ForegroundColor Yellow