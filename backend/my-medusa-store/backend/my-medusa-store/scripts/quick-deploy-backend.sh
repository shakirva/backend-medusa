#!/bin/bash

# ============================================
# MarqaSouq QUICK Backend Deployment Script
# VPS: 72.61.240.40 (Hostinger)
# Date: February 25, 2026
# 
# Usage: ssh root@72.61.240.40 < quick-deploy-backend.sh
# Or:    scp quick-deploy-backend.sh root@72.61.240.40:/tmp/ && ssh root@72.61.240.40 'bash /tmp/quick-deploy-backend.sh'
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
echo -e "${BLUE}║        MarqaSouq Quick Backend Deployment                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

BACKEND_DIR="/var/www/marqa-souq/backend/backend-medusa"

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}✗ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

cd $BACKEND_DIR

# Step 1: Pull latest code
echo -e "${YELLOW}[1/5] Pulling latest code...${NC}"
git pull origin main 2>/dev/null || echo "Git pull skipped (not a git repo or no remote)"

# Step 2: Stop backend
echo -e "${YELLOW}[2/5] Stopping backend...${NC}"
pm2 stop medusa-backend 2>/dev/null || true

# Step 3: Install dependencies (if package.json changed)
echo -e "${YELLOW}[3/5] Checking dependencies...${NC}"
npm install --production 2>&1 | tail -5

# Step 4: Build with Medusa (includes admin dashboard)
echo -e "${YELLOW}[4/5] Building backend + admin dashboard...${NC}"
npx medusa build 2>&1 | tail -10

# CRITICAL FIX: Copy admin build to correct location
echo -e "${YELLOW}    Copying admin build to public/admin...${NC}"
mkdir -p $BACKEND_DIR/public
cp -r $BACKEND_DIR/.medusa/server/public/admin $BACKEND_DIR/public/
echo -e "${GREEN}    ✓ Admin build copied${NC}"

# Step 5: Start backend
echo -e "${YELLOW}[5/5] Starting backend...${NC}"
pm2 restart medusa-backend 2>/dev/null || pm2 start npm --name "medusa-backend" -- run start
pm2 save

# Verify
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"
sleep 10

# Check health
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Backend health check: OK${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $HEALTH)${NC}"
fi

# Check admin
ADMIN=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/app 2>/dev/null || echo "000")
if [ "$ADMIN" = "200" ] || [ "$ADMIN" = "301" ] || [ "$ADMIN" = "302" ]; then
    echo -e "${GREEN}✓ Admin dashboard: OK${NC}"
else
    echo -e "${YELLOW}⚠ Admin dashboard check returned HTTP $ADMIN${NC}"
fi

echo ""
pm2 list
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Backend Deployment Complete!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "URLs:"
echo "  API:   https://admin.markasouqs.com"
echo "  Admin: https://admin.markasouqs.com/app"
echo ""
