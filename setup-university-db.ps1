# Setup University Database - PostgreSQL is now running
Write-Host "Setting up University Management Database..." -ForegroundColor Green

# First, let's set the postgres password to something we know
Write-Host "Setting postgres password..."
$setupSQL = @"
-- Set postgres password
ALTER USER postgres PASSWORD 'admin123';

-- Create database
CREATE DATABASE university_db;

-- Create admin user
CREATE USER ma_admin WITH PASSWORD 'admin123' SUPERUSER;

-- Show success
SELECT 'Database setup completed!' as message;
"@

# Save SQL to temp file
$sqlFile = "C:\Users\Dell\Desktop\smssysv1\university-backend\temp-setup.sql"
$setupSQL | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "Running database setup..."
try {
    # Run the SQL (it will prompt for password - use whatever you set during initialization)
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -f $sqlFile
    
    # Clean up temp file
    Remove-Item $sqlFile -Force
    
    Write-Host "`nDatabase setup completed!" -ForegroundColor Green
    Write-Host "Database: university_db" -ForegroundColor Yellow
    Write-Host "Admin user: ma_admin / admin123" -ForegroundColor Yellow
    Write-Host "Postgres user: postgres / admin123" -ForegroundColor Yellow
    
    # Test the new admin user
    Write-Host "`nTesting admin user connection..."
    $env:PGPASSWORD = "admin123"
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U ma_admin -d university_db -c "SELECT 'Admin user works!' as test;"
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "Error running setup: $_" -ForegroundColor Red
    if (Test-Path $sqlFile) { Remove-Item $sqlFile -Force }
    exit 1
}