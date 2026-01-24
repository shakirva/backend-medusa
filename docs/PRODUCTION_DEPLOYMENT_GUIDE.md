# Medusa v2 Production Deployment Guide
## Marqa Souq - Quick Reference

> **Last Updated:** January 2026  
> **Medusa Version:** 2.10.3

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTION SERVER                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     NGINX (Reverse Proxy)                │ │
│  │  api.marqasouq.com → localhost:9000                     │ │
│  │  marqasouq.com → localhost:3000                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│           ┌───────────────┴───────────────┐                  │
│           ▼                               ▼                   │
│  ┌─────────────────────┐      ┌─────────────────────┐        │
│  │   Medusa Backend    │      │   Next.js Store     │        │
│  │   PM2: :9000        │      │   PM2: :3000        │        │
│  │                     │      │                     │        │
│  │   • REST API        │      │   • Customer UI     │        │
│  │   • Admin UI /app   │      │   • Product pages   │        │
│  │   • Custom modules  │      │   • Cart/Checkout   │        │
│  └─────────────────────┘      └─────────────────────┘        │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                     │
│  │    PostgreSQL       │                                     │
│  │    :5432            │                                     │
│  └─────────────────────┘                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Server Folder Structure

```
/var/www/marqa-souq/
├── backend/
│   └── my-medusa-store/
│       ├── .env                    # Production environment
│       ├── .medusa/
│       │   ├── server/             # ⭐ BUILT API (run from here)
│       │   │   ├── .env            # Copied from root
│       │   │   ├── node_modules/   # Production deps only
│       │   │   └── src/            # Compiled code
│       │   └── client/             # ⭐ BUILT Admin UI
│       │       └── index.html      # Must exist!
│       ├── src/                    # Source code
│       └── static/uploads/         # User uploads
│
├── frontend/
│   └── markasouq-web/
│       ├── .env.production.local   # Production environment
│       └── .next/                  # Built Next.js
│
├── logs/                           # Deployment logs
└── ecosystem.config.js             # PM2 configuration
```

---

## 🚀 Quick Deployment Commands

### Deploy Backend Only
```bash
cd /var/www/marqa-souq/backend/my-medusa-store
git pull origin main
yarn install
yarn build
cp .env .medusa/server/.env
cd .medusa/server && yarn install --production
cd ../..
npx medusa db:migrate
pm2 restart medusa-backend
```

### Deploy Frontend Only
```bash
cd /var/www/marqa-souq/frontend/markasouq-web
git pull origin main
yarn install
yarn build
pm2 restart nextjs-storefront
```

### Using Deployment Script
```bash
cd /var/www/marqa-souq
./scripts/production-deploy.sh backend    # Deploy backend only
./scripts/production-deploy.sh frontend   # Deploy frontend only
./scripts/production-deploy.sh all        # Deploy everything
./scripts/production-deploy.sh rollback   # Rollback backend
./scripts/production-deploy.sh status     # Check status
```

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# 1. Check PM2 processes
pm2 list

# 2. Backend API health
curl http://localhost:9000/health

# 3. Admin UI accessible
curl -I http://localhost:9000/app/

# 4. Frontend accessible
curl -I http://localhost:3000

# 5. Check logs for errors
pm2 logs medusa-backend --lines 50
pm2 logs nextjs-storefront --lines 50
```

---

## ⚠️ Critical Rules

### ✅ DO:
- Always run `yarn build` before deploying
- Always copy `.env` to `.medusa/server/.env`
- Always run `yarn install --production` in `.medusa/server/`
- Always run `npx medusa db:migrate` for schema changes
- Keep backups of `.medusa/` before rebuilding

### ❌ DON'T:
- Don't run `medusa start` from the source directory
- Don't edit files in `.medusa/` directly
- Don't skip the build step when pulling code changes
- Don't use Node.js < 20
- Don't ignore build errors

---

## 🔧 PM2 Commands

```bash
# View all processes
pm2 list

# View logs (real-time)
pm2 logs medusa-backend
pm2 logs nextjs-storefront

# Restart processes
pm2 restart medusa-backend
pm2 restart nextjs-storefront
pm2 restart all

# Stop processes
pm2 stop all

# Delete processes
pm2 delete all

# Reload config
pm2 reload ecosystem.config.js

# Save PM2 state
pm2 save

# Setup startup script
pm2 startup
```

---

## 🐛 Troubleshooting

### Error: "Could not find index.html in the admin build directory"

**Cause:** Admin UI build failed or is missing.

**Solution:**
```bash
# 1. Clean rebuild
cd /var/www/marqa-souq/backend/my-medusa-store
rm -rf .medusa
yarn build

# 2. Verify index.html exists
ls -la .medusa/client/
# Should show: entry.jsx, index.css, index.html

# 3. If still missing, check for build errors
yarn build 2>&1 | grep -i error
```

### Error: "Cannot find module" on startup

**Cause:** Dependencies not installed in `.medusa/server/`.

**Solution:**
```bash
cd /var/www/marqa-souq/backend/my-medusa-store/.medusa/server
yarn install --production
pm2 restart medusa-backend
```

### Error: "ECONNREFUSED" when accessing API

**Cause:** Backend not running or port mismatch.

**Solution:**
```bash
# Check if running
pm2 list
netstat -tlnp | grep 9000

# Restart if needed
pm2 restart medusa-backend
pm2 logs medusa-backend
```

### Error: Admin UI blank or not loading

**Cause:** Missing client files or CORS issues.

**Solution:**
```bash
# 1. Verify client build
cat /var/www/marqa-souq/backend/my-medusa-store/.medusa/client/index.html

# 2. Check CORS in .env
grep ADMIN_CORS .env

# 3. Rebuild if necessary
yarn build
```

---

## 📊 Environment Variables

### Backend `.env`
```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/marqa_souq_db

# Security
JWT_SECRET=your-64-char-random-string
COOKIE_SECRET=your-64-char-random-string

# CORS
STORE_CORS=https://marqasouq.com
ADMIN_CORS=https://api.marqasouq.com
AUTH_CORS=https://marqasouq.com,https://api.marqasouq.com

# Backend
BACKEND_URL=https://api.marqasouq.com
NODE_ENV=production
PORT=9000
```

### Frontend `.env.production.local`
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.marqasouq.com
NEXT_PUBLIC_BASE_URL=https://marqasouq.com
```

---

## 🔄 Update Workflow

### For API Changes (routes, modules, workflows):
```bash
./scripts/production-deploy.sh backend
```

### For Admin UI Changes (custom routes, widgets):
```bash
./scripts/production-deploy.sh backend  # Admin is bundled with backend
```

### For Storefront Changes:
```bash
./scripts/production-deploy.sh frontend
```

### For Database Schema Changes:
```bash
# Migrations are auto-run in deploy script
# Or manually:
cd /var/www/marqa-souq/backend/my-medusa-store
npx medusa db:migrate
pm2 restart medusa-backend
```

---

## 📞 Support Links

- [Medusa v2 Documentation](https://docs.medusajs.com/)
- [Medusa Discord](https://discord.gg/medusajs)
- [Medusa GitHub Issues](https://github.com/medusajs/medusa/issues)
