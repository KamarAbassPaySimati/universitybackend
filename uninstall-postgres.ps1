# Uninstall PostgreSQL completely - Run as Administrator
Write-Host "Uninstalling PostgreSQL completely..." -ForegroundColor Red

# Stop all PostgreSQL services
Write-Host "Stopping PostgreSQL services..."
Get-Service -Name "postgresql*" | Stop-Service -Force -ErrorAction SilentlyContinue

# Remove PostgreSQL from Programs and Features
Write-Host "Removing PostgreSQL installation..."
$uninstallPath = "C:\Program Files\PostgreSQL\17\uninstall-postgresql.exe"
if (Test-Path $uninstallPath) {
    Start-Process -FilePath $uninstallPath -ArgumentList "--mode unattended" -Wait
    Write-Host "PostgreSQL uninstalled via uninstaller" -ForegroundColor Green
}

# Remove remaining directories
Write-Host "Cleaning up remaining files..."
$paths = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "C:\ProgramData\PostgreSQL"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $path" -ForegroundColor Yellow
    }
}

# Remove PostgreSQL from PATH
Write-Host "Cleaning PATH environment variable..."
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$newPath = ($currentPath -split ';' | Where-Object { $_ -notlike "*PostgreSQL*" }) -join ';'
[Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")

Write-Host "`nPostgreSQL has been completely removed!" -ForegroundColor Green
Write-Host "Please restart your computer before reinstalling." -ForegroundColor Yellow