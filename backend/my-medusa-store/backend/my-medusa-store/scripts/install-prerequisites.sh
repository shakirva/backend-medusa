#!/bin/bash

# Marqa Souq - Install Prerequisites
# This script installs all required tools for development

set -e  # Exit on error

echo "🔧 Installing Prerequisites for Marqa Souq"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Homebrew is installed
echo -e "${BLUE}📋 Checking Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}⚠️  Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    echo -e "${GREEN}✅ Homebrew installed${NC}"
else
    echo -e "${GREEN}✅ Homebrew already installed${NC}"
    brew update
fi

echo ""
echo -e "${BLUE}📋 Installing Node.js 20 LTS...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${YELLOW}⚠️  Node.js $NODE_VERSION is already installed${NC}"
    read -p "Reinstall Node.js? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew reinstall node@20
    fi
else
    brew install node@20
    brew link node@20
fi

# Verify Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js installation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Installing Yarn...${NC}"
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn -v)
    echo -e "${GREEN}✅ Yarn already installed: $YARN_VERSION${NC}"
else
    npm install -g yarn
    YARN_VERSION=$(yarn -v)
    echo -e "${GREEN}✅ Yarn installed: $YARN_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}📋 Installing PostgreSQL 14...${NC}"
if command -v psql &> /dev/null; then
    POSTGRES_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL already installed: $POSTGRES_VERSION${NC}"
else
    brew install postgresql@14
    brew services start postgresql@14
    
    # Add PostgreSQL to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
    
    sleep 5  # Wait for PostgreSQL to start
    echo -e "${GREEN}✅ PostgreSQL 14 installed and started${NC}"
fi

# Ensure PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 3
fi

if pg_isready -q; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Installing Redis (optional but recommended)...${NC}"
if command -v redis-server &> /dev/null; then
    echo -e "${GREEN}✅ Redis already installed${NC}"
else
    brew install redis
    brew services start redis
    echo -e "${GREEN}✅ Redis installed and started${NC}"
fi

echo ""
echo -e "${BLUE}📋 Installing Git (if needed)...${NC}"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git already installed: $GIT_VERSION${NC}"
else
    brew install git
    echo -e "${GREEN}✅ Git installed${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 All Prerequisites Installed!${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📝 Installed Tools:${NC}"
echo ""
node -v | xargs echo "   Node.js:     "
yarn -v | xargs echo "   Yarn:        "
psql --version | xargs echo "   PostgreSQL:  "
git --version | xargs echo "   Git:         "
if command -v redis-server &> /dev/null; then
    redis-server --version | xargs echo "   Redis:       "
fi
echo ""
echo "================================================"
echo ""
echo -e "${BLUE}📝 Next Step:${NC}"
echo ""
echo "Run the environment setup script:"
echo -e "   ${YELLOW}./scripts/setup-dev-environment.sh${NC}"
echo ""
echo "Good luck! 🚀"
