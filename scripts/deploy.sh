#!/bin/bash

# ============================================
# Marqa Souq - Application Deployment Script
# Run this after server setup is complete
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - UPDATE THESE VALUES
PROJECT_DIR="/var/www/marqa-souq"
BACKEND_DIR="$PROJECT_DIR/backend/my-medusa-store"
FRONTEND_DIR="$PROJECT_DIR/frontend/markasouq-web"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Marqa Souq Deployment Script${NC}"
echo -e "${GREEN}============================================${NC}"

# ============================================
# Deploy Backend
# ============================================
deploy_backend() {
    echo -e "\n${YELLOW}Deploying Medusa Backend...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    yarn install
    
    # Build
    echo -e "${BLUE}Building backend...${NC}"
    yarn build:production
    
    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    npx medusa db:migrate
    
    echo -e "${GREEN}Backend deployment complete!${NC}"
}

# ============================================
# Deploy Frontend
# ============================================
deploy_frontend() {
    echo -e "\n${YELLOW}Deploying Next.js Frontend...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Increase Node memory for build
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    yarn install
    
    # Build
    echo -e "${BLUE}Building frontend...${NC}"
    yarn build
    
    echo -e "${GREEN}Frontend deployment complete!${NC}"
}

# ============================================
# Start with PM2
# ============================================
start_pm2() {
    echo -e "\n${YELLOW}Starting applications with PM2...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Check if ecosystem file exists
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        echo -e "${RED}ecosystem.config.js not found!${NC}"
        echo -e "${YELLOW}Starting applications manually...${NC}"
        
        # Start backend
        cd "$BACKEND_DIR"
        pm2 start yarn --name "medusa-backend" -- start:production
        
        # Start frontend
        cd "$FRONTEND_DIR"
        pm2 start yarn --name "nextjs-frontend" -- start
    fi
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}Applications started!${NC}"
    pm2 status
}

# ============================================
# Restart Applications
# ============================================
restart_apps() {
    echo -e "\n${YELLOW}Restarting applications...${NC}"
    pm2 restart all
    echo -e "${GREEN}Applications restarted!${NC}"
    pm2 status
}

# ============================================
# View Logs
# ============================================
view_logs() {
    pm2 logs
}

# ============================================
# Main Menu
# ============================================
show_menu() {
    echo ""
    echo -e "${BLUE}What would you like to do?${NC}"
    echo "1) Deploy Backend"
    echo "2) Deploy Frontend"
    echo "3) Deploy Both"
    echo "4) Start PM2"
    echo "5) Restart All"
    echo "6) View Logs"
    echo "7) PM2 Status"
    echo "8) Exit"
    echo ""
    read -p "Enter choice [1-8]: " choice
    
    case $choice in
        1) deploy_backend ;;
        2) deploy_frontend ;;
        3) deploy_backend && deploy_frontend ;;
        4) start_pm2 ;;
        5) restart_apps ;;
        6) view_logs ;;
        7) pm2 status ;;
        8) exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
}

# Check for command line arguments
if [ "$1" == "--backend" ]; then
    deploy_backend
    exit 0
elif [ "$1" == "--frontend" ]; then
    deploy_frontend
    exit 0
elif [ "$1" == "--all" ]; then
    deploy_backend
    deploy_frontend
    start_pm2
    exit 0
elif [ "$1" == "--start" ]; then
    start_pm2
    exit 0
elif [ "$1" == "--restart" ]; then
    restart_apps
    exit 0
fi

# Show interactive menu
while true; do
    show_menu
done
