# Connect with Admin password and setup database
Write-Host "Connecting to PostgreSQL with 'Admin' password..." -ForegroundColor Green

# Set password environment variable
$env:PGPASSWORD = "Admin"

# Test connection
Write-Host "Testing connection..."
$result = & psql -U postgres -d postgres -c "SELECT 'Connected successfully!' as status;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Connected with password 'Admin'" -ForegroundColor Green
    Write-Host "Creating database and users..." -ForegroundColor Cyan
    
    # Create database and setup
    $setupSQL = @"
-- Create database
CREATE DATABASE university_db;

-- Create admin user
CREATE USER ma_admin WITH PASSWORD 'admin123' SUPERUSER;

-- Show success
SELECT 'Database and user created successfully!' as message;
"@
    
    # Run setup SQL
    $setupSQL | & psql -U postgres -d postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDatabase setup completed!" -ForegroundColor Green
        Write-Host "Database: university_db" -ForegroundColor Yellow
        Write-Host "Admin user: ma_admin / admin123" -ForegroundColor Yellow
        Write-Host "Postgres user: postgres / Admin" -ForegroundColor Yellow
        
        Write-Host "`nTesting new admin user connection..." -ForegroundColor Cyan
        $env:PGPASSWORD = "admin123"
        & psql -U ma_admin -d university_db -c "SELECT 'Admin user works!' as test;"
    } else {
        Write-Host "Error creating database/user" -ForegroundColor Red
    }
} else {
    Write-Host "Could not connect with password 'Admin'" -ForegroundColor Red
    Write-Host "Please verify your PostgreSQL password" -ForegroundColor Yellow
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue