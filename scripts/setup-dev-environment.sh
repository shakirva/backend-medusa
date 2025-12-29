#!/bin/bash

# Marqa Souq - Environment Setup Script
# This script will set up everything needed for development

set -e  # Exit on error

echo "🚀 Marqa Souq - Environment Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa"
BACKEND_PATH="$PROJECT_ROOT/backend/my-medusa-store"
STOREFRONT_PATH="$PROJECT_ROOT/backend/my-medusa-store-storefront"

# Database config
DB_NAME="marqa_souq_dev"
DB_USER="marqa_user"
DB_PASSWORD="marqa123"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}📋 Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check Yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn is not installed. Please install Yarn first.${NC}"
    exit 1
fi
YARN_VERSION=$(yarn -v)
echo -e "${GREEN}✅ Yarn: $YARN_VERSION${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first.${NC}"
    exit 1
fi
POSTGRES_VERSION=$(psql --version)
echo -e "${GREEN}✅ PostgreSQL: $POSTGRES_VERSION${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    brew services start postgresql@14 || brew services start postgresql
    sleep 3
fi

if pg_isready -q; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 2: Setting up database...${NC}"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        dropdb $DB_NAME || true
        echo "Creating fresh database..."
        createdb $DB_NAME
        echo -e "${GREEN}✅ Database recreated${NC}"
    else
        echo -e "${BLUE}Using existing database${NC}"
    fi
else
    echo "Creating database '$DB_NAME'..."
    createdb $DB_NAME
    echo -e "${GREEN}✅ Database created${NC}"
fi

# Create user if not exists (this might fail if user exists, that's ok)
echo "Setting up database user..."
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
echo -e "${GREEN}✅ Database user configured${NC}"

echo ""
echo -e "${BLUE}📋 Step 3: Setting up backend...${NC}"

cd "$BACKEND_PATH"

# Generate secrets if needed
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
# Database
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

# Server
BACKEND_URL=http://localhost:9000

# CORS
STORE_CORS=http://localhost:8000,http://localhost:3000
ADMIN_CORS=http://localhost:9000,http://localhost:7001
AUTH_CORS=http://localhost:9000

# Secrets (auto-generated)
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Redis (optional, comment out if not using)
# REDIS_URL=redis://localhost:6379
EOF

echo -e "${GREEN}✅ Backend .env created${NC}"

# Install dependencies
echo "Installing backend dependencies..."
if [ -d "node_modules" ]; then
    echo "Cleaning old node_modules..."
    rm -rf node_modules
fi
yarn install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Run migrations
echo "Running database migrations..."
yarn medusa db:migrate
echo -e "${GREEN}✅ Migrations completed${NC}"

echo ""
echo -e "${BLUE}📋 Step 4: Creating admin user...${NC}"

# Create admin user
echo "Creating admin user (admin@marqasouq.com)..."
yarn medusa user --email admin@marqasouq.com --password admin123 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Admin user might already exist${NC}"
}
echo -e "${GREEN}✅ Admin user ready${NC}"

echo ""
echo -e "${BLUE}📋 Step 5: Seeding sample data...${NC}"

# Seed data
echo "Seeding sample data..."
yarn seed
echo -e "${GREEN}✅ Sample data seeded${NC}"

echo ""
echo -e "${BLUE}📋 Step 6: Setting up storefront...${NC}"

cd "$STOREFRONT_PATH"

# Create .env.local
echo "Creating storefront .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
EOF

echo -e "${GREEN}✅ Storefront .env.local created${NC}"

# Install dependencies
echo "Installing storefront dependencies..."
if [ -d "node_modules" ]; then
    echo "Cleaning old node_modules..."
    rm -rf node_modules
fi
if [ -d ".next" ]; then
    rm -rf .next
fi
yarn install
echo -e "${GREEN}✅ Storefront dependencies installed${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Start Backend (Terminal 1):"
echo -e "   ${YELLOW}cd $BACKEND_PATH${NC}"
echo -e "   ${YELLOW}yarn dev${NC}"
echo ""
echo "2. Start Storefront (Terminal 2):"
echo -e "   ${YELLOW}cd $STOREFRONT_PATH${NC}"
echo -e "   ${YELLOW}yarn dev${NC}"
echo ""
echo "3. Access:"
echo -e "   Admin:      ${GREEN}http://localhost:9000/app${NC}"
echo -e "   Storefront: ${GREEN}http://localhost:8000${NC}"
echo ""
echo "4. Login Credentials:"
echo -e "   Email:    ${GREEN}admin@marqasouq.com${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo ""
echo "5. Test API:"
echo -e "   ${YELLOW}curl http://localhost:9000/store/products${NC}"
echo ""
echo "================================================"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Verification: docs/ENVIRONMENT_VERIFICATION.md"
echo "   - Quick Start:  docs/QUICK_START_GUIDE.md"
echo "   - Full Plan:    docs/COMPLETE_PROJECT_PLAN.md"
echo ""
echo "Good luck! 🚀"
