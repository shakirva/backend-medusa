# 🚀 Marqa Souq - Complete Hostinger VPS Deployment Guide

## Table of Contents

1. [Prerequisites & Requirements](#1-prerequisites--requirements)
2. [Hostinger VPS Initial Setup](#2-hostinger-vps-initial-setup)
3. [Install Required Software](#3-install-required-software)
4. [Database Setup (PostgreSQL)](#4-database-setup-postgresql)
5. [Redis Setup](#5-redis-setup)
6. [Deploy Medusa Backend](#6-deploy-medusa-backend)
7. [Deploy Next.js Frontend](#7-deploy-nextjs-frontend)
8. [Nginx Reverse Proxy Setup](#8-nginx-reverse-proxy-setup)
9. [SSL Certificate Setup](#9-ssl-certificate-setup)
10. [PM2 Process Management](#10-pm2-process-management)
11. [Domain Configuration](#11-domain-configuration)
12. [Firewall Configuration](#12-firewall-configuration)
13. [Troubleshooting](#13-troubleshooting)
14. [Maintenance & Updates](#14-maintenance--updates)

---

## 1. Prerequisites & Requirements

### Hostinger VPS Minimum Requirements
- **OS**: Ubuntu 22.04 LTS (Recommended)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 40GB SSD minimum
- **CPU**: 2 vCPU cores minimum

### What You'll Need
- Hostinger VPS access (IP address, root password)
- Domain name (e.g., marqasouq.com)
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- Your local project files

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Hostinger VPS Server                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌──────────────┐ │
│   │   Nginx     │────▶│   Next.js   │     │   Medusa     │ │
│   │   (Port 80) │     │ (Port 3000) │     │ (Port 9000)  │ │
│   └─────────────┘     └─────────────┘     └──────────────┘ │
│          │                                       │          │
│          │            ┌─────────────┐            │          │
│          └───────────▶│  PostgreSQL │◀───────────┘          │
│                       │ (Port 5432) │                       │
│                       └─────────────┘                       │
│                              │                              │
│                       ┌─────────────┐                       │
│                       │    Redis    │                       │
│                       │ (Port 6379) │                       │
│                       └─────────────┘                       │
│                                                              │
│   All managed by PM2 process manager                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Hostinger VPS Initial Setup

### Step 2.1: Access Your VPS

Open your terminal and connect via SSH:

```bash
# Connect to your VPS (replace with your actual IP)
ssh root@YOUR_VPS_IP_ADDRESS

# Example:
ssh root@192.168.1.100
```

When prompted, enter your root password (provided by Hostinger).

### Step 2.2: Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano unzip software-properties-common
```

### Step 2.3: Create a Non-Root User (Security Best Practice)

```bash
# Create new user (replace 'marqa' with your preferred username)
adduser marqa

# Add user to sudo group
usermod -aG sudo marqa

# Switch to new user
su - marqa
```

### Step 2.4: Set Up SSH Key Authentication (Optional but Recommended)

On your **local machine**:
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy SSH key to server
ssh-copy-id marqa@YOUR_VPS_IP_ADDRESS
```

---

## 3. Install Required Software

### Step 3.1: Install Node.js v20 (LTS)

```bash
# Install Node.js 20.x using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install Yarn (package manager)
sudo npm install -g yarn

# Verify Yarn
yarn --version
```

### Step 3.2: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 3.3: Install Build Tools

```bash
# Install build essentials
sudo apt install -y build-essential python3

# These are needed for native Node.js modules
```

---

## 4. Database Setup (PostgreSQL)

### Step 4.1: Install PostgreSQL 14

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt update

# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib-14

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

### Step 4.2: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database for Medusa
createdb marqa_souq_db

# Create database user
createuser --interactive --pwprompt marqa_user
# When prompted:
# - Enter password: (choose a strong password, e.g., MarqaSecure2024!)
# - Shall the new role be a superuser? n
# - Shall the new role be allowed to create databases? n
# - Shall the new role be allowed to create more new roles? n

# Connect to PostgreSQL
psql

# Grant privileges to user
GRANT ALL PRIVILEGES ON DATABASE marqa_souq_db TO marqa_user;

# Connect to the database and grant schema privileges
\c marqa_souq_db
GRANT ALL ON SCHEMA public TO marqa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO marqa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO marqa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO marqa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO marqa_user;

# Exit PostgreSQL
\q

# Exit postgres user
exit
```

### Step 4.3: Configure PostgreSQL for Remote Connections (if needed)

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line (for local connections):
# local   marqa_souq_db   marqa_user                      md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4.4: Test Database Connection

```bash
# Test connection
psql -U marqa_user -d marqa_souq_db -h localhost

# If successful, you'll see:
# marqa_souq_db=>

# Exit with:
\q
```

---

## 5. Redis Setup

### Step 5.1: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
sudo systemctl status redis-server
```

### Step 5.2: Configure Redis

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Find and modify these settings:
# supervised systemd    (uncomment this line)
# maxmemory 256mb       (add this line, adjust based on your RAM)
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server

# Test Redis connection
redis-cli ping
# Should return: PONG
```

---

## 6. Deploy Medusa Backend

### Step 6.1: Create Project Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/marqa-souq
sudo chown -R $USER:$USER /var/www/marqa-souq
cd /var/www/marqa-souq
```

### Step 6.2: Upload Your Project Files

**Option A: Using Git (Recommended)**

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/marqa-souq.git .

# Or if private repository
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/marqa-souq.git .
```

**Option B: Using SCP (From your local machine)**

```bash
# On your LOCAL machine, run:
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa

# Upload backend
scp -r backend marqa@YOUR_VPS_IP:/var/www/marqa-souq/

# Upload frontend
scp -r frontend marqa@YOUR_VPS_IP:/var/www/marqa-souq/
```

**Option C: Using rsync (Recommended for large files)**

```bash
# On your LOCAL machine:
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.medusa' \
  /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/ \
  marqa@YOUR_VPS_IP:/var/www/marqa-souq/
```

### Step 6.3: Set Up Medusa Backend

```bash
# Navigate to backend directory
cd /var/www/marqa-souq/backend/my-medusa-store

# Install dependencies
yarn install

# Create production environment file
nano .env
```

### Step 6.4: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Database Configuration
DATABASE_URL=postgres://marqa_user:YOUR_DB_PASSWORD@localhost:5432/marqa_souq_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security Keys (CHANGE THESE - use random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-64chars
COOKIE_SECRET=your-super-secret-cookie-key-change-this-to-random-string-64chars

# CORS Configuration (replace with your actual domains)
STORE_CORS=https://marqasouq.com,https://www.marqasouq.com
ADMIN_CORS=https://admin.marqasouq.com,https://marqasouq.com
AUTH_CORS=https://marqasouq.com,https://admin.marqasouq.com

# Backend URL
BACKEND_URL=https://api.marqasouq.com

# Node Environment
NODE_ENV=production

# Optional: Stripe (if using)
# STRIPE_API_KEY=sk_live_your_stripe_key
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Generate secure secrets:**
```bash
# Generate random JWT secret
openssl rand -base64 48

# Generate random Cookie secret
openssl rand -base64 48
```

### Step 6.5: Build Medusa Backend

```bash
# Build the project
yarn build

# OR using the production build script
yarn build:production
```

### Step 6.6: Run Database Migrations

```bash
# Run Medusa migrations
npx medusa db:migrate

# Seed initial data (optional, for fresh setup)
yarn seed
```

### Step 6.7: Test Backend

```bash
# Start in development mode to test
yarn start

# Should see:
# Server is running on port 9000
# Admin dashboard available at /app

# Press Ctrl+C to stop
```

---

## 7. Deploy Next.js Frontend

### Step 7.1: Set Up Frontend

```bash
# Navigate to frontend directory
cd /var/www/marqa-souq/frontend/markasouq-web

# Install dependencies
yarn install

# Create production environment file
nano .env.production.local
```

### Step 7.2: Configure Frontend Environment

```bash
# Add to .env.production.local
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.marqasouq.com
NEXT_PUBLIC_BASE_URL=https://marqasouq.com

# If you have publishable API key
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key
```

### Step 7.3: Build Frontend

```bash
# Build Next.js for production
yarn build

# This will create optimized production build in .next folder
```

### Step 7.4: Test Frontend

```bash
# Start production server
yarn start

# Should run on port 3000
# Press Ctrl+C to stop
```

---

## 8. Nginx Reverse Proxy Setup

### Step 8.1: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### Step 8.2: Create Nginx Configuration for Medusa Backend

```bash
# Create config for API
sudo nano /etc/nginx/sites-available/api.marqasouq.com
```

Add the following configuration:

```nginx
# Medusa Backend API Configuration
server {
    listen 80;
    server_name api.marqasouq.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Handle file uploads
    client_max_body_size 200M;

    # Static files for uploads
    location /uploads {
        alias /var/www/marqa-souq/backend/my-medusa-store/static/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 8.3: Create Nginx Configuration for Frontend

```bash
# Create config for frontend
sudo nano /etc/nginx/sites-available/marqasouq.com
```

Add the following configuration:

```nginx
# Next.js Frontend Configuration
server {
    listen 80;
    server_name marqasouq.com www.marqasouq.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000/_next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        alias /var/www/marqa-souq/frontend/markasouq-web/public;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Handle large uploads if needed
    client_max_body_size 50M;
}
```

### Step 8.4: Enable Sites and Test Configuration

```bash
# Create symbolic links to enable sites
sudo ln -s /etc/nginx/sites-available/api.marqasouq.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/marqasouq.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 9. SSL Certificate Setup

### Step 9.1: Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

### Step 9.2: Obtain SSL Certificates

```bash
# Get certificate for API domain
sudo certbot --nginx -d api.marqasouq.com

# Get certificate for frontend domain
sudo certbot --nginx -d marqasouq.com -d www.marqasouq.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (choose Yes)
```

### Step 9.3: Verify Auto-Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Certbot automatically adds a cron job for renewal
```

---

## 10. PM2 Process Management

### Step 10.1: Create PM2 Ecosystem File

```bash
# Navigate to project root
cd /var/www/marqa-souq

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'medusa-backend',
      cwd: '/var/www/marqa-souq/backend/my-medusa-store',
      script: 'yarn',
      args: 'start:production',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9000
      },
      error_file: '/var/log/pm2/medusa-error.log',
      out_file: '/var/log/pm2/medusa-out.log',
      time: true
    },
    {
      name: 'nextjs-frontend',
      cwd: '/var/www/marqa-souq/frontend/markasouq-web',
      script: 'yarn',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/nextjs-error.log',
      out_file: '/var/log/pm2/nextjs-out.log',
      time: true
    }
  ]
};
```

### Step 10.2: Create Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### Step 10.3: Start Applications with PM2

```bash
# Start all applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# View specific app logs
pm2 logs medusa-backend
pm2 logs nextjs-frontend
```

### Step 10.4: Save PM2 Configuration & Setup Startup

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup systemd

# Copy and run the command that PM2 outputs
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u marqa --hp /home/marqa
```

### Step 10.5: PM2 Useful Commands

```bash
# Restart all apps
pm2 restart all

# Restart specific app
pm2 restart medusa-backend
pm2 restart nextjs-frontend

# Stop all apps
pm2 stop all

# Delete all apps
pm2 delete all

# Monitor resources
pm2 monit

# View detailed info
pm2 show medusa-backend
```

---

## 11. Domain Configuration

### Step 11.1: DNS Configuration in Hostinger

1. Log in to your Hostinger account
2. Go to **Domains** → Select your domain
3. Go to **DNS Zone**
4. Add the following DNS records:

| Type | Name | Points to | TTL |
|------|------|-----------|-----|
| A | @ | YOUR_VPS_IP | 14400 |
| A | www | YOUR_VPS_IP | 14400 |
| A | api | YOUR_VPS_IP | 14400 |
| A | admin | YOUR_VPS_IP | 14400 |

### Step 11.2: Verify DNS Propagation

```bash
# Check DNS propagation (from your local machine)
dig marqasouq.com
dig api.marqasouq.com

# Or use online tool: https://dnschecker.org
```

---

## 12. Firewall Configuration

### Step 12.1: Configure UFW Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Nginx
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status verbose
```

### Step 12.2: Verify Open Ports

```bash
# List listening ports
sudo ss -tulpn
```

---

## 13. Troubleshooting

### Common Issues and Solutions

#### Issue 1: Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Test connection manually
psql -U marqa_user -d marqa_souq_db -h localhost
```

#### Issue 2: Medusa Won't Start

```bash
# Check PM2 logs
pm2 logs medusa-backend --lines 100

# Check if port is in use
sudo lsof -i :9000

# Manually test
cd /var/www/marqa-souq/backend/my-medusa-store
yarn start
```

#### Issue 3: Frontend Build Fails

```bash
# Check Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Rebuild
cd /var/www/marqa-souq/frontend/markasouq-web
rm -rf .next node_modules
yarn install
yarn build
```

#### Issue 4: Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

#### Issue 5: CORS Errors

```bash
# Update backend .env with correct CORS origins
nano /var/www/marqa-souq/backend/my-medusa-store/.env

# Make sure STORE_CORS, ADMIN_CORS, AUTH_CORS include all your domains
# Restart backend
pm2 restart medusa-backend
```

#### Issue 6: SSL Certificate Issues

```bash
# Renew certificates manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Useful Debug Commands

```bash
# Check all services
sudo systemctl status postgresql redis-server nginx

# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
htop

# Check application logs
pm2 logs --lines 200

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 14. Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Check PM2 status
pm2 status

# Rotate logs
pm2 flush
```

#### Update Application Code

```bash
# Pull latest code (if using Git)
cd /var/www/marqa-souq
git pull origin main

# Update backend
cd backend/my-medusa-store
yarn install
yarn build:production
pm2 restart medusa-backend

# Update frontend
cd ../../frontend/markasouq-web
yarn install
yarn build
pm2 restart nextjs-frontend
```

### Backup Strategy

#### Database Backup

```bash
# Create backup script
nano /var/www/marqa-souq/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/marqa-souq"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U marqa_user -d marqa_souq_db > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

```bash
# Make executable
chmod +x /var/www/marqa-souq/scripts/backup-db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e

# Add line:
0 2 * * * /var/www/marqa-souq/scripts/backup-db.sh
```

#### Files Backup

```bash
# Backup uploads folder
tar -czvf /var/backups/marqa-souq/uploads_$(date +%Y%m%d).tar.gz \
  /var/www/marqa-souq/backend/my-medusa-store/static/uploads
```

---

## Quick Reference Commands

```bash
# Start all services
pm2 start ecosystem.config.js

# Stop all services
pm2 stop all

# Restart everything
pm2 restart all
sudo systemctl restart nginx

# View status
pm2 status
sudo systemctl status postgresql redis-server nginx

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Update and restart backend
cd /var/www/marqa-souq/backend/my-medusa-store
git pull
yarn install
yarn build:production
pm2 restart medusa-backend

# Update and restart frontend
cd /var/www/marqa-souq/frontend/markasouq-web
git pull
yarn install
yarn build
pm2 restart nextjs-frontend
```

---

## Security Checklist

- [ ] Changed default SSH port (optional)
- [ ] Disabled root SSH login
- [ ] Set up SSH key authentication
- [ ] Configured UFW firewall
- [ ] SSL certificates installed
- [ ] Strong database passwords
- [ ] Strong JWT and Cookie secrets
- [ ] Regular security updates
- [ ] Automated backups configured

---

## Support & Resources

- **MedusaJS Documentation**: https://docs.medusajs.com/
- **MedusaJS v2 Overview**: https://medusajs.com/v2-overview/
- **Next.js Documentation**: https://nextjs.org/docs
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Hostinger Support**: https://www.hostinger.com/support

---

**Congratulations! 🎉** Your Marqa Souq application should now be deployed and running on your Hostinger VPS server.

**Next Steps:**
1. Access your admin dashboard at `https://api.marqasouq.com/app`
2. Create an admin user
3. Configure your store settings
4. Add products and start selling!

