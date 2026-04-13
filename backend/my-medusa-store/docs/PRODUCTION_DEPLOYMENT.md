# Production Deployment Guide

> **Stack**: Medusa v2 Backend + Next.js Frontend  
> **Dev**: macOS ARM64 | **Prod**: Linux x64 VPS  
> **Node**: v20+ (required for Medusa v2)

---

## Why Lock Files Are Removed

Lock files (`package-lock.json`, `yarn.lock`) contain OS-specific native binary references. When developing on macOS ARM64 and deploying to Linux x64:

- Native modules (like `@rollup/rollup-darwin-arm64`) are platform-specific
- Lock files pin these binaries, causing `npm install` failures on different architectures
- Fresh `npm install` on each platform resolves the correct binaries

**GitHub is the source of truth. Server is disposable.**

---

## Prerequisites (Linux VPS One-Time Setup)

### 1. Install Node 20 via nvm

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Install and use Node 20
nvm install 20
nvm alias default 20
nvm use 20

# Verify
node -v  # Should be v20.x.x
```

> ⚠️ **Do NOT use Node 18** - Medusa v2 requires Node >= 20

### 2. Install PM2 Globally

```bash
npm install -g pm2
```

### 3. PM2 Auto-Start on Reboot

```bash
pm2 startup
# Follow the command it outputs (run as sudo)
```

### 4. Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

---

## Directory Structure (Recommended)

```
/var/www/marqa-souq/
├── backend/my-medusa-store/      # Medusa v2 API (port 9000)
├── frontend/markasouq-web/       # Next.js (port 3000)
└── .env files (managed separately per environment)
```

---

## Backend Deployment (Medusa v2)

### Initial Clone

```bash
cd /var/www
git clone git@github.com:shakirva/medusa.git marqa-souq
cd marqa-souq/backend/my-medusa-store
```

### Environment File

Create `/var/www/marqa-souq/backend/my-medusa-store/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/medusa

# Medusa
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=https://your-domain.com
ADMIN_CORS=https://admin.your-domain.com

# Redis (if used)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
COOKIE_SECRET=your-super-secret-cookie-key
```

### Deployment Commands

```bash
cd /var/www/marqa-souq/backend/my-medusa-store

# 1. Reset and pull latest code
git reset --hard
git pull origin main

# 2. Clean install (removes platform-specific binaries)
rm -rf node_modules
npm install

# 3. Run migrations (ONLY after git pull, idempotent)
npx medusa migrations run

# 4. Build (includes admin UI)
npm run build

# 5. Restart PM2
pm2 restart backend || pm2 start npm --name "backend" -- run start
pm2 save
```

### PM2 Ecosystem (Optional)

Create `/var/www/marqa-souq/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/var/www/marqa-souq/backend/my-medusa-store',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 9000
      }
    },
    {
      name: 'frontend',
      cwd: '/var/www/marqa-souq/frontend/markasouq-web',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

---

## Frontend Deployment (Next.js)

### Environment File

Create `/var/www/marqa-souq/frontend/markasouq-web/tion`:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Deployment Commands

```bash
cd /var/www/marqa-souq/frontend/markasouq-web

# 1. Pull latest code
git pull origin main

# 2. Clean install
rm -rf node_modules
npm install

# 3. Build
npm run build

# 4. Restart PM2
pm2 restart frontend || pm2 start npm --name "frontend" -- run start
pm2 save
```

---

## Nginx Configuration

### Backend API (`/etc/nginx/sites-available/api.your-domain.com`)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend (`/etc/nginx/sites-available/your-domain.com`)

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
}
```

### Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/api.your-domain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Quick Deploy Cheat Sheet

### 🚀 Full Deployment (Copy-Paste Ready)

```bash
#!/bin/bash
# Save as: /var/www/marqa-souq/deploy.sh

set -e

echo "=== DEPLOYING MARQA SOUQ ==="

# Backend
echo ">>> Deploying Backend..."
cd /var/www/marqa-souq/backend/my-medusa-store
git reset --hard
git pull origin main
rm -rf node_modules
npm install
npx medusa migrations run
npm run build
pm2 restart backend || pm2 start npm --name "backend" -- run start

# Frontend
echo ">>> Deploying Frontend..."
cd /var/www/marqa-souq/frontend/markasouq-web
git pull origin main
rm -rf node_modules
npm install
npm run build
pm2 restart frontend || pm2 start npm --name "frontend" -- run start

# Save PM2 state
pm2 save

# Restart Nginx
sudo systemctl restart nginx

echo "=== DEPLOYMENT COMPLETE ==="
pm2 status
```

Make executable:

```bash
chmod +x /var/www/marqa-souq/deploy.sh
```

Run:

```bash
/var/www/marqa-souq/deploy.sh
```

---

## PM2 Commands Reference

```bash
# View status
pm2 status

# View logs
pm2 logs backend
pm2 logs frontend

# Restart apps
pm2 restart all

# Stop apps
pm2 stop all

# Delete apps
pm2 delete all

# Monitor
pm2 monit

# Save current process list
pm2 save

# Restore saved processes
pm2 resurrect
```

---

## When to Run Migrations

Run migrations **only** after:
- `git pull` that includes database schema changes
- Initial deployment

```bash
npx medusa migrations run
```

Migrations are **idempotent** - safe to run multiple times.

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Lock files (`package-lock.json`, `yarn.lock`) are in `.gitignore`
- [ ] `node_modules/` is in `.gitignore`
- [ ] Use strong `JWT_SECRET` and `COOKIE_SECRET`
- [ ] Enable HTTPS via Certbot
- [ ] Firewall allows only ports 80, 443, and SSH

### Setup HTTPS (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d api.your-domain.com
```

---

## Troubleshooting

### Port 9000 Already in Use

```bash
lsof -i :9000
kill -9 <PID>
pm2 restart backend
```

### Migration Errors

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# View migration status
npx medusa migrations show
```

### PM2 Not Starting on Reboot

```bash
pm2 startup
pm2 save
```

### Node Version Mismatch

```bash
nvm use 20
node -v
```

---

## Summary

| Component | Port | Command |
|-----------|------|---------|
| Backend   | 9000 | `npm run start` |
| Frontend  | 3000 | `npm run start` |

| Task | Command |
|------|---------|
| Build Backend | `npm run build` |
| Run Migrations | `npx medusa migrations run` |
| Build Frontend | `npm run build` |
| Deploy All | `/var/www/marqa-souq/deploy.sh` |
