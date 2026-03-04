#!/bin/bash

# ============================================
# MarqaSouq QUICK Frontend Deployment Script
# VPS: 72.61.240.40 (Hostinger)
# Date: February 25, 2026
# 
# Usage: ssh root@72.61.240.40 < quick-deploy-frontend.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        MarqaSouq Quick Frontend Deployment                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

FRONTEND_DIR="/var/www/marqa-souq/frontend/markasouq-web"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

cd $FRONTEND_DIR

# Step 1: Pull latest code
echo -e "${YELLOW}[1/4] Pulling latest code...${NC}"
git pull origin main 2>&1 | tail -3

# Step 2: Stop frontend
echo -e "${YELLOW}[2/4] Stopping frontend...${NC}"
pm2 stop nextjs-storefront 2>/dev/null || true

# Step 3: Install dependencies & build
echo -e "${YELLOW}[3/4] Installing dependencies & building...${NC}"
npm install 2>&1 | tail -5
npm run build 2>&1 | tail -10

# Step 4: Start frontend
echo -e "${YELLOW}[4/4] Starting frontend...${NC}"
pm2 restart nextjs-storefront 2>/dev/null || pm2 start npm --name "nextjs-storefront" -- run start
pm2 save

# Verify
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Frontend health check: OK${NC}"
else
    echo -e "${RED}✗ Frontend health check failed (HTTP $HEALTH)${NC}"
fi

echo ""
pm2 list
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Frontend Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "URL: https://website.markasouqs.com"
echo ""
