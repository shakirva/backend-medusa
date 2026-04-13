#!/bin/bash

# Quick Setup - Install Only Missing Tools
# This installs only Yarn and Redis since you have the rest

echo "🔧 Quick Setup - Installing Missing Tools"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Step 1: Fixing Homebrew PATH...${NC}"

# Add Homebrew to PATH for this session
eval "$(/opt/homebrew/bin/brew shellenv)"

# Add to .zshrc if not already there
if ! grep -q 'eval "$(/opt/homebrew/bin/brew shellenv)"' ~/.zshrc 2>/dev/null; then
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    echo -e "${GREEN}✅ Added Homebrew to .zshrc${NC}"
else
    echo -e "${GREEN}✅ Homebrew already in .zshrc${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 2: Checking what's installed...${NC}"

# Check Node.js
if /opt/homebrew/bin/brew list node &> /dev/null || /opt/homebrew/bin/brew list node@20 &> /dev/null; then
    echo -e "${GREEN}✅ Node.js is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing Node.js 20...${NC}"
    /opt/homebrew/bin/brew install node@20
fi

# Check PostgreSQL
if /opt/homebrew/bin/brew list postgresql@14 &> /dev/null || /opt/homebrew/bin/brew list postgresql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
    # Make sure it's running
    /opt/homebrew/bin/brew services start postgresql@14 2>/dev/null || /opt/homebrew/bin/brew services start postgresql
else
    echo -e "${YELLOW}⚠️  Installing PostgreSQL 14...${NC}"
    /opt/homebrew/bin/brew install postgresql@14
    /opt/homebrew/bin/brew services start postgresql@14
fi

echo ""
echo -e "${BLUE}📋 Step 3: Installing Yarn...${NC}"
if command -v yarn &> /dev/null; then
    echo -e "${GREEN}✅ Yarn already installed${NC}"
else
    /opt/homebrew/bin/npm install -g yarn
    echo -e "${GREEN}✅ Yarn installed${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Installing Redis (optional)...${NC}"
if /opt/homebrew/bin/brew list redis &> /dev/null; then
    echo -e "${GREEN}✅ Redis already installed${NC}"
else
    /opt/homebrew/bin/brew install redis
    /opt/homebrew/bin/brew services start redis
    echo -e "${GREEN}✅ Redis installed and started${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Close and reopen your terminal now!${NC}"
echo ""
echo "After reopening terminal, verify with:"
echo "   node -v"
echo "   yarn -v"
echo "   psql --version"
echo ""
echo "Then run:"
echo "   ./scripts/setup-dev-environment.sh"
echo ""
