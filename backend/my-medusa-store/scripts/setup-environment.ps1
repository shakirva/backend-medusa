# Setup Windows Environment for MedusaJS E-Commerce Development

Write-Host "🚀 Setting up Marqa Souq E-Commerce Development Environment..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL 14+ from https://www.postgresql.org/download/windows/" -ForegroundColor Red
    exit 1
}

# Check if Git is installed
Write-Host "Checking Git installation..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git not found. Please install Git from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Environment check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: cd backend && npm create medusa-app@latest . --db-url postgres://marqa_user:marqa123@localhost:5432/marqa_souq_v2" -ForegroundColor White
Write-Host "2. Run: cd frontend && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias '@/*'" -ForegroundColor White
Write-Host "3. Follow the PROJECT_PLAN.md for detailed implementation steps" -ForegroundColor White