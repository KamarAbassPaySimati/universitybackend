# Install PostgreSQL using Chocolatey - Run as Administrator
Write-Host "Installing PostgreSQL using Chocolatey..." -ForegroundColor Green

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey first..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Install PostgreSQL
Write-Host "Installing PostgreSQL..."
choco install postgresql17 --params '/Password:admin123' -y

# Wait for installation
Start-Sleep -Seconds 10

# Start PostgreSQL service
Write-Host "Starting PostgreSQL service..."
Start-Service postgresql-x64-17 -ErrorAction SilentlyContinue

# Test connection
Write-Host "Testing connection..."
$env:PGPASSWORD = "admin123"
psql -U postgres -c "SELECT 'PostgreSQL is working!' as status;"
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "PostgreSQL installation completed!" -ForegroundColor Green