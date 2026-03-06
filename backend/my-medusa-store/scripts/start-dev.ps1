# Quick Start Script for Windows
# Run this script to quickly start your development environment

Write-Host "🚀 Starting Marqa Souq Development Environment..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port($port) {
    $result = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $result
}

# Check if required ports are available
Write-Host "Checking required ports..." -ForegroundColor Yellow

$ports = @(3000, 9000, 7001, 5432)
$portsInUse = @()

foreach ($port in $ports) {
    if (Test-Port $port) {
        $portsInUse += $port
        Write-Host "⚠️  Port $port is already in use" -ForegroundColor Red
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "❌ Some required ports are in use. Please close applications using these ports:" -ForegroundColor Red
    Write-Host "   Frontend (3000), Backend (9000), Admin (7001), PostgreSQL (5432)" -ForegroundColor White
    Write-Host "   Use 'netstat -ano | findstr :PORT' to find processes using specific ports" -ForegroundColor White
    exit 1
}

Write-Host "✅ All ports available. Starting services..." -ForegroundColor Green

# Start PostgreSQL service if not running
Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service postgresql-x64-14 -ErrorAction Stop
    Write-Host "✅ PostgreSQL service started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not start PostgreSQL service automatically. Please start it manually." -ForegroundColor Yellow
}

# Create new PowerShell windows for each service
Write-Host "Opening development terminals..." -ForegroundColor Yellow

# Backend terminal
$backendScript = @"
Write-Host 'Starting MedusaJS Backend...' -ForegroundColor Cyan
Set-Location '$PWD\backend'
npm run dev
"@

# Frontend terminal  
$frontendScript = @"
Write-Host 'Starting Next.js Frontend...' -ForegroundColor Cyan
Set-Location '$PWD\frontend'
npm run dev
"@

# Admin terminal
$adminScript = @"
Write-Host 'Starting Admin Dashboard...' -ForegroundColor Cyan
Set-Location '$PWD\backend'
Start-Sleep -Seconds 10
npx @medusajs/admin dev
"@

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Wait a moment
Start-Sleep -Seconds 2

# Start admin (optional)
$response = Read-Host "Do you want to start the Admin Dashboard? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $adminScript
}

Write-Host ""
Write-Host "🎉 Development environment is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:9000" -ForegroundColor White
Write-Host "  Admin:     http://localhost:7001" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Please wait 30-60 seconds for all services to start completely." -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check WEEK1_TASKS.md for daily implementation tasks" -ForegroundColor White
Write-Host "  2. Follow PROJECT_PLAN.md for the complete development timeline" -ForegroundColor White
Write-Host "  3. Use VS Code to open the project and start coding!" -ForegroundColor White