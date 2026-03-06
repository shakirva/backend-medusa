#!/bin/bash

# ============================================
# Marqa Souq - VPS Server Setup Script
# Run this on your Hostinger VPS server
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Marqa Souq VPS Server Setup Script${NC}"
echo -e "${GREEN}============================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo ./setup-vps.sh)${NC}"
    exit 1
fi

# ============================================
# Step 1: Update System
# ============================================
echo -e "\n${YELLOW}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git nano unzip software-properties-common build-essential python3

# ============================================
# Step 2: Install Node.js 20
# ============================================
echo -e "\n${YELLOW}Step 2: Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Yarn and PM2
npm install -g yarn pm2

echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"
echo -e "${GREEN}Yarn version: $(yarn --version)${NC}"
echo -e "${GREEN}PM2 version: $(pm2 --version)${NC}"

# ============================================
# Step 3: Install PostgreSQL 14
# ============================================
echo -e "\n${YELLOW}Step 3: Installing PostgreSQL 14...${NC}"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-14 postgresql-contrib-14

systemctl start postgresql
systemctl enable postgresql

echo -e "${GREEN}PostgreSQL installed and running${NC}"

# ============================================
# Step 4: Install Redis
# ============================================
echo -e "\n${YELLOW}Step 4: Installing Redis...${NC}"
apt install -y redis-server

# Configure Redis
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf

systemctl restart redis-server
systemctl enable redis-server

echo -e "${GREEN}Redis installed and running${NC}"

# ============================================
# Step 5: Install Nginx
# ============================================
echo -e "\n${YELLOW}Step 5: Installing Nginx...${NC}"
apt install -y nginx

systemctl start nginx
systemctl enable nginx

echo -e "${GREEN}Nginx installed and running${NC}"

# ============================================
# Step 6: Install Certbot for SSL
# ============================================
echo -e "\n${YELLOW}Step 6: Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}Certbot installed${NC}"

# ============================================
# Step 7: Configure Firewall
# ============================================
echo -e "\n${YELLOW}Step 7: Configuring UFW Firewall...${NC}"
ufw allow ssh
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${GREEN}Firewall configured${NC}"

# ============================================
# Step 8: Create Project Directory
# ============================================
echo -e "\n${YELLOW}Step 8: Creating project directory...${NC}"
mkdir -p /var/www/marqa-souq
mkdir -p /var/log/pm2

echo -e "${GREEN}Directories created${NC}"

# ============================================
# Summary
# ============================================
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  Server Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Installed software:"
echo -e "  - Node.js: $(node --version)"
echo -e "  - npm: $(npm --version)"
echo -e "  - Yarn: $(yarn --version)"
echo -e "  - PM2: $(pm2 --version)"
echo -e "  - PostgreSQL: $(psql --version | head -1)"
echo -e "  - Redis: $(redis-server --version | head -1)"
echo -e "  - Nginx: $(nginx -v 2>&1)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create PostgreSQL database and user:"
echo "   sudo -i -u postgres"
echo "   createdb marqa_souq_db"
echo "   createuser --interactive --pwprompt marqa_user"
echo ""
echo "2. Upload your project files to /var/www/marqa-souq/"
echo ""
echo "3. Configure environment variables"
echo ""
echo "4. Set up Nginx virtual hosts"
echo ""
echo "5. Get SSL certificates with Certbot"
echo ""
echo -e "${GREEN}See HOSTINGER_VPS_DEPLOYMENT.md for detailed instructions${NC}"
