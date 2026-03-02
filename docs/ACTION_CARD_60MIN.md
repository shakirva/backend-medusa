# 📌 ACTION CARD - NEXT 60 MINUTES

**Status:** Code ready. Ready to build and deploy.  
**Timeline:** 60 minutes from now to production  
**Complexity:** Medium (just execute the steps)

---

## ⏱️ MINUTE-BY-MINUTE BREAKDOWN

### 0-5 MINUTES: REVIEW

- [ ] Read this card (2 min)
- [ ] Open DEPLOYMENT_GUIDE.md (1 min)
- [ ] Skim FINAL_SUMMARY.md (2 min)

**Expected:** You understand the plan

---

### 5-15 MINUTES: BUILD BACKEND

```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store

npm install    # 3 min
npm run build  # 7 min

# ✓ Check: Output says "Build complete"
# ✓ Check: No errors shown
```

**Expected:** Backend builds successfully

---

### 15-25 MINUTES: BUILD FRONTEND

```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/frontend/markasouq-web

npm install    # 3 min
npm run build  # 7 min

# ✓ Check: Output says "Built successfully"
# ✓ Check: No errors shown
```

**Expected:** Frontend builds successfully

---

### 25-35 MINUTES: TEST LOCALLY

**Terminal 1: Backend**
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
npm run dev

# Wait for: "Medusa server started"
# ✓ Should run on http://localhost:9000
```

**Terminal 2: Frontend**
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/frontend/markasouq-web
npm run dev

# Wait for: "Ready in" message
# ✓ Should run on http://localhost:3000
```

**Terminal 3: Test**
```bash
# Test webhook
curl -X POST http://localhost:9000/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{"event_type":"product.created","product":{"odoo_id":123,"name":"Test Product","sku":"TEST-123","barcode":"123456","list_price":100,"qty_available":10,"brand_name":"TestBrand","model":"T-100","warranty":"1 Year"}}'

# ✓ Should get: {"success": true, "action": "created", ...}
```

**Browser Test:**
```
Open: http://localhost:3000/en/products/[any-product-id]
✓ Check: Page loads
✓ Check: Product name shows
✓ Check: No console errors (F12)
```

**Expected:** Everything works locally

---

### 35-55 MINUTES: DEPLOY TO PRODUCTION

**SSH to Server:**
```bash
ssh root@72.61.240.40

# Pull latest code
cd /var/www/medusa
git pull origin main

# Build backend
cd backend/my-medusa-store
npm install && npm run build

pm2 stop medusa-backend
pm2 start npm --name "medusa-backend" -- run dev

pm2 status  # ✓ Should show medusa-backend online

# Build frontend
cd ../frontend/markasouq-web
npm install && npm run build

pm2 stop nextjs-app
pm2 start npm --name "nextjs-app" -- run start

pm2 status  # ✓ Should show nextjs-app online
```

**Expected:** Both services running on production

---

### 55-60 MINUTES: VERIFY & DONE

**Still in SSH:**
```bash
# Test backend
curl http://localhost:9000/health
# ✓ Should return: {"status": "ok"}

# Test webhook
curl -X POST http://localhost:9000/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{"event_type":"product.created","product":{"odoo_id":999,"name":"Verify Product","sku":"VERIFY-999"}}'
# ✓ Should return: {"success": true}

# Test frontend
curl http://localhost:3000 | head -20
# ✓ Should contain "marka souq"
```

**In Browser:**
```
Open: http://72.61.240.40/en/products/[product-id]

Checklist:
✓ Page loads
✓ Product image displays
✓ Product name shows
✓ Brand & model visible
✓ Price displays
✓ Stock status shows
✓ Warranty badge shows
✓ Seller info displays
✓ Delivery options work
✓ Specifications tab shows fields
✓ Features display
✓ Payment methods visible
✓ No console errors (F12)
✓ Mobile responsive (test on mobile)
```

**Expected:** Production live and working

---

## 🎯 WHAT YOU NEED READY

1. **Terminal access** (4-5 terminals)
2. **SSH access to 72.61.240.40** (working)
3. **This card** (read & follow)
4. **DEPLOYMENT_GUIDE.md** (reference)
5. **Coffee** ☕ (optional but recommended)

---

## ⚠️ IF SOMETHING GOES WRONG

### Build fails
```bash
# Try clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Webpack error
```bash
# Try
npm cache clean --force
npm install
npm run build
```

### Server won't start
```bash
# Check port
lsof -i :9000  # or :3000

# Kill if needed
kill -9 <PID>

# Try again
pm2 restart all
```

### Lost database connection
```bash
# Check .env file
cat .env | grep DATABASE

# Verify database is running
psql -c "SELECT 1"
```

### Still stuck?
- Check DEPLOYMENT_GUIDE.md troubleshooting
- Check pm2 logs: `pm2 logs`
- Revert last commit: `git revert HEAD`

---

## ✅ FINAL CHECKLIST

### Before You Start
- [ ] All terminals ready
- [ ] SSH access working
- [ ] Have admin access to server
- [ ] Read this card once
- [ ] Have DEPLOYMENT_GUIDE.md open

### After Build
- [ ] Backend builds (no errors)
- [ ] Frontend builds (no errors)
- [ ] Both run locally
- [ ] Webhook works locally
- [ ] Product page loads locally

### After Deploy
- [ ] Backend running on production
- [ ] Frontend running on production
- [ ] Webhook endpoint responds
- [ ] Product page accessible
- [ ] All fields display
- [ ] No errors in logs

### Ready for Client
- [ ] Everything works
- [ ] Production verified
- [ ] Mobile tested
- [ ] Performance acceptable
- [ ] Ready to show

---

## 📞 QUICK REFERENCE

### Key Commands

```bash
# Start backend
npm run dev -C backend/my-medusa-store

# Start frontend
npm run dev -C frontend/markasouq-web

# Deploy backend
ssh root@72.61.240.40 'cd /var/www/medusa/backend/my-medusa-store && npm install && npm run build && pm2 restart medusa-backend'

# Deploy frontend
ssh root@72.61.240.40 'cd /var/www/medusa/frontend/markasouq-web && npm install && npm run build && pm2 restart nextjs-app'

# Check status
ssh root@72.61.240.40 'pm2 status'

# View logs
ssh root@72.61.240.40 'pm2 logs medusa-backend | head -50'
```

### Key Files

```
Backend: src/api/odoo/webhooks/products/route.ts
Frontend: src/app/[lang]/products/[id]/page.js
Deployment: docs/DEPLOYMENT_GUIDE.md
Summary: docs/FINAL_SUMMARY.md
```

---

## 🎬 GO TIME!

**Start here:**
1. Open 4-5 terminals
2. Read DEPLOYMENT_GUIDE.md carefully
3. Follow the steps in order
4. Test at each stage
5. Deploy when all local tests pass
6. Verify on production
7. Done! ✅

**Time: ~60 minutes**  
**Difficulty: Medium**  
**Stress level: Low (just follow the steps)**

---

## 🎉 AFTER YOU'RE DONE

1. **Take a screenshot** of the product page
2. **Share the URL** with client (http://72.61.240.40/products/[id])
3. **Demo the fields** - show all specifications
4. **Point out the features** - warranty, delivery, seller info
5. **Celebrate!** 🎊 You delivered in 3 days!

---

**You've got this! 💪**

**Everything is ready. Just execute the plan.**

**60 minutes from now, you'll be live! 🚀**
