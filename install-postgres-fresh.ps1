# Fresh PostgreSQL Installation - Run as Administrator
Write-Host "Installing PostgreSQL with known password..." -ForegroundColor Green

# Download PostgreSQL installer
$installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-17.2-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

Write-Host "Downloading PostgreSQL installer..."
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Download completed" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Install PostgreSQL silently with known password
Write-Host "Installing PostgreSQL..."
$installArgs = @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--superpassword", "admin123",
    "--servicename", "postgresql-x64-17",
    "--servicepassword", "admin123",
    "--serverport", "5432",
    "--locale", "English, United States"
)

try {
    Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow
    Write-Host "PostgreSQL installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    exit 1
}

# Clean up installer
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

# Add PostgreSQL to PATH
$pgPath = "C:\Program Files\PostgreSQL\17\bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($currentPath -notlike "*$pgPath*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$pgPath", "Machine")
    Write-Host "Added PostgreSQL to PATH" -ForegroundColor Green
}

Write-Host "`nInstallation completed!" -ForegroundColor Green
Write-Host "PostgreSQL credentials:" -ForegroundColor Yellow
Write-Host "Username: postgres" -ForegroundColor Yellow
Write-Host "Password: admin123" -ForegroundColor Yellow
Write-Host "Port: 5432" -ForegroundColor Yellow

Write-Host "`nTesting connection..."
$env:PGPASSWORD = "admin123"
Start-Sleep -Seconds 5  # Wait for service to start
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "SELECT 'Connection successful!' as status;"
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue