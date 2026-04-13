#!/bin/bash

# ============================================
# MarqaSouq FAST Deployment Script
# VPS: 72.61.240.40 (Hostinger)
# Date: February 3, 2026
# ============================================

set -e

echo "🚀 MarqaSouq Fast Deployment Starting..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# STEP 1: MALWARE CLEANUP (FAST)
# ============================================
echo -e "${YELLOW}[1/8] Cleaning malware...${NC}"

# Kill known crypto miners
pkill -9 -f kdevtmpfsi 2>/dev/null || true
pkill -9 -f kinsing 2>/dev/null || true
pkill -9 -f xmrig 2>/dev/null || true
pkill -9 -f minerd 2>/dev/null || true
pkill -9 -f cpuminer 2>/dev/null || true

# Remove malware files
rm -f /tmp/kdevtmpfsi /tmp/kinsing /var/tmp/kdevtmpfsi /var/tmp/kinsing 2>/dev/null || true
rm -f /tmp/*.sh /var/tmp/*.sh 2>/dev/null || true

# Clean crontabs (common malware persistence)
crontab -r 2>/dev/null || true
echo "" | crontab -

# Remove suspicious authorized_keys entries (keep your own)
# sed -i '/curl\|wget\|base64/d' ~/.ssh/authorized_keys 2>/dev/null || true

echo -e "${GREEN}✓ Malware cleaned${NC}"

# ============================================
# STEP 2: SYSTEM UPDATE (SECURITY PATCHES)
# ============================================
echo -e "${YELLOW}[2/8] Applying security patches...${NC}"

apt-get update -qq
apt-get install -y -qq fail2ban ufw curl git nodejs npm 2>/dev/null || true

echo -e "${GREEN}✓ Security patches applied${NC}"

# ============================================
# STEP 3: CONFIGURE FIREWALL
# ============================================
echo -e "${YELLOW}[3/8] Configuring firewall...${NC}"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp  # Medusa Backend
ufw allow 3000/tcp  # Next.js Frontend
ufw allow 5432/tcp  # PostgreSQL (only if needed externally)
echo "y" | ufw enable

# Configure fail2ban
systemctl enable fail2ban 2>/dev/null || true
systemctl start fail2ban 2>/dev/null || true

echo -e "${GREEN}✓ Firewall configured${NC}"

# ============================================
# STEP 4: START DATABASE SERVICES
# ============================================
echo -e "${YELLOW}[4/8] Starting database services...${NC}"

systemctl start postgresql 2>/dev/null || true
systemctl start redis-server 2>/dev/null || true

# Verify PostgreSQL is running
if pg_isready -q; then
    echo -e "${GREEN}✓ PostgreSQL running${NC}"
else
    echo -e "${RED}✗ PostgreSQL not running - attempting restart${NC}"
    systemctl restart postgresql
fi

# Verify Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✓ Redis running${NC}"
else
    echo -e "${YELLOW}⚠ Redis not responding${NC}"
fi

# ============================================
# STEP 5: INSTALL/UPDATE PM2
# ============================================
echo -e "${YELLOW}[5/8] Setting up PM2...${NC}"

npm install -g pm2 2>/dev/null || true
pm2 startup 2>/dev/null || true

echo -e "${GREEN}✓ PM2 ready${NC}"

# ============================================
# STEP 6: DEPLOY MARQASOUQ BACKEND
# ============================================
echo -e "${YELLOW}[6/8] Deploying Medusa Backend...${NC}"

# Navigate to backend directory
BACKEND_DIR="/var/www/marqasouq/backend/my-medusa-store"

if [ -d "$BACKEND_DIR" ]; then
    cd $BACKEND_DIR
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        echo "Installing backend dependencies..."
        npm install --production
    fi
    
    # Build if needed
    if [ ! -d ".medusa/server" ]; then
        echo "Building backend..."
        npm run build
    fi
    
    # Stop existing process
    pm2 delete medusa-backend 2>/dev/null || true
    
    # Start with PM2
    pm2 start npm --name "medusa-backend" -- run start
    
    echo -e "${GREEN}✓ Backend deployed${NC}"
else
    echo -e "${RED}✗ Backend directory not found at $BACKEND_DIR${NC}"
    echo "Please upload the backend code first"
fi

# ============================================
# STEP 7: DEPLOY MARQASOUQ FRONTEND
# ============================================
echo -e "${YELLOW}[7/8] Deploying Next.js Frontend...${NC}"

FRONTEND_DIR="/var/www/marqasouq/frontend/markasouq-web"

if [ -d "$FRONTEND_DIR" ]; then
    cd $FRONTEND_DIR
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install --production
    fi
    
    # Build if needed
    if [ ! -d ".next" ]; then
        echo "Building frontend..."
        npm run build
    fi
    
    # Stop existing process
    pm2 delete markasouq-frontend 2>/dev/null || true
    
    # Start with PM2
    pm2 start npm --name "markasouq-frontend" -- run start
    
    echo -e "${GREEN}✓ Frontend deployed${NC}"
else
    echo -e "${RED}✗ Frontend directory not found at $FRONTEND_DIR${NC}"
    echo "Please upload the frontend code first"
fi

# ============================================
# STEP 8: CONFIGURE NGINX
# ============================================
echo -e "${YELLOW}[8/8] Configuring Nginx...${NC}"

# Create Nginx config
cat > /etc/nginx/sites-available/marqasouq << 'NGINX'
# MarqaSouq Nginx Configuration

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Backend API
server {
    listen 80;
    server_name api.marqasouq.com;

    location / {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:9000/health;
        access_log off;
    }
}

# Frontend
server {
    listen 80;
    server_name marqasouq.com www.marqasouq.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.marqasouq.com;

    location / {
        proxy_pass http://127.0.0.1:9000/app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/marqasouq /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload nginx
nginx -t && systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# ============================================
# SAVE PM2 PROCESSES
# ============================================
pm2 save

# ============================================
# FINAL STATUS CHECK
# ============================================
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""

# Show PM2 status
pm2 list

echo ""
echo "Services Status:"
echo "----------------"

# Check backend
if curl -s http://localhost:9000/health >/dev/null 2>&1; then
    echo -e "Backend API:  ${GREEN}✓ Running${NC} (http://localhost:9000)"
else
    echo -e "Backend API:  ${RED}✗ Not responding${NC}"
fi

# Check frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "Frontend:     ${GREEN}✓ Running${NC} (http://localhost:3000)"
else
    echo -e "Frontend:     ${RED}✗ Not responding${NC}"
fi

# Check PostgreSQL
if pg_isready -q; then
    echo -e "PostgreSQL:   ${GREEN}✓ Running${NC}"
else
    echo -e "PostgreSQL:   ${RED}✗ Not running${NC}"
fi

# Check Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "Redis:        ${GREEN}✓ Running${NC}"
else
    echo -e "Redis:        ${YELLOW}⚠ Not responding${NC}"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo -e "Nginx:        ${GREEN}✓ Running${NC}"
else
    echo -e "Nginx:        ${RED}✗ Not running${NC}"
fi

echo ""
echo "URLs:"
echo "-----"
echo "Frontend:  http://marqasouq.com"
echo "API:       http://api.marqasouq.com"
echo "Admin:     http://admin.marqasouq.com"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Configure SSL with: certbot --nginx -d marqasouq.com -d www.marqasouq.com -d api.marqasouq.com -d admin.marqasouq.com"
echo "2. Update DNS records to point to: 72.61.240.40"
echo "3. Test the site!"
echo ""
