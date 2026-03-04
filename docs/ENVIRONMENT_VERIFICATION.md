# 🔍 Environment Verification & Setup Guide

**Date:** November 17, 2025  
**Purpose:** Verify MedusaJS backend, admin dashboard, and storefront are working before custom development

---

## ✅ PRE-FLIGHT CHECKLIST

Before we start custom development, let's verify everything works:

- [ ] PostgreSQL installed and running
- [ ] Node.js 18+ installed
- [ ] Yarn installed
- [ ] Backend starts without errors
- [ ] Storefront starts without errors
- [ ] Admin dashboard accessible
- [ ] Database has sample data
- [ ] All basic features working

---

## 🚀 STEP-BY-STEP VERIFICATION

### STEP 1: Verify Prerequisites (5 minutes)

Open terminal and check:

```bash
# Check Node.js version (should be 18+)
node --version
# Expected: v18.x.x or v20.x.x

# Check PostgreSQL
psql --version
# Expected: psql (PostgreSQL) 14.x or higher

# Check Yarn
yarn --version
# Expected: 1.22.x or 3.x.x

# Check if PostgreSQL is running
pg_isready
# Expected: accepting connections
```

**If PostgreSQL is not running:**
```bash
# macOS (if using Homebrew)
brew services start postgresql@14

# Or check if it's already running
brew services list
```

---

### STEP 2: Database Setup (5 minutes)

#### Create Fresh Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql, create database and user:
CREATE DATABASE marqa_souq_dev;
CREATE USER marqa_user WITH PASSWORD 'marqa123';
GRANT ALL PRIVILEGES ON DATABASE marqa_souq_dev TO marqa_user;

# Exit psql
\q
```

**Verify database created:**
```bash
psql -l | grep marqa_souq_dev
# Should show the database
```

---

### STEP 3: Backend Environment Configuration (5 minutes)

Navigate to backend directory:
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
```

#### Check if .env file exists:
```bash
ls -la | grep .env
```

**If `.env` file doesn't exist, create it:**
```bash
cp .env.template .env
```

**Edit `.env` file with correct database connection:**
```bash
# Open in your editor
code .env
# or
nano .env
# or
vim .env
```

**Required .env contents:**
```env
# Database
DATABASE_URL=postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev

# Backend URL
BACKEND_URL=http://localhost:9000

# Store URL
STORE_CORS=http://localhost:8000,http://localhost:3000

# Admin
ADMIN_CORS=http://localhost:9000,http://localhost:7001

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cookie Secret (generate a random string)
COOKIE_SECRET=your-super-secret-cookie-key-change-this
```

**To generate secure secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### STEP 4: Install Dependencies (5 minutes)

```bash
# Make sure you're in backend directory
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store

# Clear any old modules
rm -rf node_modules
rm -rf .medusa

# Install fresh
yarn install

# This may take 2-5 minutes
```

**Expected output:**
```
✨  Done in X.XXs.
```

---

### STEP 5: Run Database Migrations (2 minutes)

```bash
# Still in backend directory
yarn medusa migrations run
```

**Expected output:**
```
✔ Migrations completed successfully
```

**If you see errors:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Verify database exists

---

### STEP 6: Start Backend Server (Test Run)

```bash
# Start development server
yarn dev
```

**Expected output:**
```
info:    Processing /Users/.../medusa-config.ts...
info:    Starting Medusa...
info:    Database connection established successfully
info:    Server is ready on port: 9000
info:    Admin dashboard: http://localhost:9000/app
```

**✅ SUCCESS INDICATORS:**
- No errors in console
- See "Server is ready on port: 9000"
- See "Admin dashboard" URL

**❌ COMMON ERRORS & FIXES:**

**Error: "database does not exist"**
```bash
# Create database
createdb marqa_souq_dev
# Then run migrations again
```

**Error: "port 9000 already in use"**
```bash
# Kill process on port 9000
lsof -ti:9000 | xargs kill -9
# Then start again
```

**Error: "MODULE_NOT_FOUND"**
```bash
# Reinstall dependencies
rm -rf node_modules
yarn install
```

---

### STEP 7: Create Admin User (2 minutes)

**Open a NEW terminal (keep backend running):**

```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store

# Create admin user
yarn medusa user --email admin@marqasouq.com --password admin123
```

**Expected output:**
```
✔ User created successfully!
Email: admin@marqasouq.com
```

**Alternative: Interactive mode**
```bash
yarn medusa user -i
# Then enter email and password when prompted
```

---

### STEP 8: Seed Sample Data (5 minutes)

```bash
# Still in backend directory (new terminal)
yarn seed
```

**Expected output:**
```
✔ Seeding data...
✔ Created regions
✔ Created products
✔ Created categories
✔ Seeding completed successfully!
```

**This will create:**
- Sample regions (US, Europe, etc.)
- Sample products (10-20 items)
- Sample categories
- Sample collections
- Sample shipping options

---

### STEP 9: Verify Admin Dashboard (5 minutes)

1. **Open browser:**
   ```
   http://localhost:9000/app
   ```

2. **Login with:**
   - Email: `admin@marqasouq.com`
   - Password: `admin123`

3. **Verify you can access:**
   - ✅ Dashboard (overview page)
   - ✅ Products page (should see seeded products)
   - ✅ Orders page
   - ✅ Customers page
   - ✅ Settings page

4. **Test: Create a product**
   - Click "Products" → "New Product"
   - Enter:
     - Title: "Test Product"
     - Description: "Testing admin dashboard"
     - Price: 100
   - Click "Publish"
   - ✅ Product should be created

5. **Test: View product details**
   - Click on the product you created
   - ✅ Should see product details page

---

### STEP 10: Setup & Start Storefront (10 minutes)

**Open a NEW terminal (keep backend running):**

```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store-storefront
```

#### Check environment:
```bash
ls -la | grep .env
```

**Create `.env.local` if it doesn't exist:**
```bash
touch .env.local
```

**Edit `.env.local`:**
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

#### Install dependencies:
```bash
# Clear old modules
rm -rf node_modules
rm -rf .next

# Install
yarn install
```

#### Start storefront:
```bash
yarn dev
```

**Expected output:**
```
✔ Ready in X.XXs
○ Local:        http://localhost:8000
```

---

### STEP 11: Verify Storefront (5 minutes)

1. **Open browser:**
   ```
   http://localhost:8000
   ```

2. **Verify you can see:**
   - ✅ Home page loads
   - ✅ Products are displayed
   - ✅ You can click on a product
   - ✅ Product detail page loads

3. **Test: Browse products**
   - Navigate to products page
   - ✅ Should see seeded products

4. **Test: Product detail**
   - Click on any product
   - ✅ Should see product images, price, description
   - ✅ Should see "Add to Cart" button

5. **Test: Add to cart**
   - Click "Add to Cart"
   - ✅ Cart icon should update
   - ✅ Can view cart

6. **Test: Customer registration**
   - Try to create account
   - ✅ Registration form works

---

### STEP 12: API Testing (5 minutes)

**Test backend APIs with curl:**

```bash
# Test health endpoint
curl http://localhost:9000/health
# Expected: {"status":"ok"}

# Test store products endpoint
curl http://localhost:9000/store/products
# Expected: JSON with products array

# Test store regions
curl http://localhost:9000/store/regions
# Expected: JSON with regions array

# Test store categories
curl http://localhost:9000/store/categories
# Expected: JSON with categories array
```

**Or use your browser:**
- http://localhost:9000/store/products
- http://localhost:9000/store/regions
- http://localhost:9000/store/categories

**✅ All should return JSON data**

---

## 📊 VERIFICATION CHECKLIST

After completing all steps, verify:

### Backend
- [ ] PostgreSQL running and accessible
- [ ] Database `marqa_souq_dev` created
- [ ] Dependencies installed (node_modules folder exists)
- [ ] Migrations completed successfully
- [ ] Backend starts on port 9000
- [ ] No errors in backend console
- [ ] Sample data seeded

### Admin Dashboard
- [ ] Can access http://localhost:9000/app
- [ ] Can login with admin@marqasouq.com
- [ ] Dashboard loads successfully
- [ ] Can see products list
- [ ] Can create new product
- [ ] Can view product details
- [ ] Can edit product
- [ ] Can view orders page
- [ ] Can view customers page

### Storefront
- [ ] Dependencies installed
- [ ] Storefront starts on port 8000
- [ ] Home page loads
- [ ] Products are visible
- [ ] Can click on product
- [ ] Product detail page works
- [ ] Can add product to cart
- [ ] Cart updates correctly
- [ ] Can register new customer

### APIs
- [ ] Health endpoint works
- [ ] Store products endpoint returns data
- [ ] Store regions endpoint returns data
- [ ] Store categories endpoint returns data

---

## 🎯 WHAT YOU SHOULD SEE NOW

### Terminal 1 (Backend):
```
info:    Server is ready on port: 9000
info:    Admin dashboard: http://localhost:9000/app
```

### Terminal 2 (Storefront):
```
✔ Ready in 3.2s
○ Local:        http://localhost:8000
```

### Browser Tab 1 (Admin):
```
http://localhost:9000/app
→ Logged in as admin@marqasouq.com
→ Can see dashboard with products
```

### Browser Tab 2 (Storefront):
```
http://localhost:8000
→ Can see home page
→ Can see products
→ Can add to cart
```

---

## ✅ SUCCESS! You're Ready for Custom Development

If ALL checkboxes above are ✅, you can now start custom development!

**Next steps:**
1. ✅ Everything verified and working
2. ⏳ Start Brands API development (Week 1, Day 1)
3. ⏳ Follow `docs/QUICK_START_GUIDE.md`

---

## ❌ TROUBLESHOOTING GUIDE

### Problem: Backend won't start

**Error: "Cannot connect to database"**
```bash
# Check PostgreSQL is running
brew services list
# or
pg_isready

# If not running:
brew services start postgresql@14

# Verify connection:
psql -U marqa_user -d marqa_souq_dev -h localhost
# Password: marqa123
```

**Error: "Port 9000 already in use"**
```bash
# Find and kill process
lsof -ti:9000 | xargs kill -9

# Then restart
yarn dev
```

**Error: "Migrations failed"**
```bash
# Drop and recreate database
dropdb marqa_souq_dev
createdb marqa_souq_dev

# Run migrations again
yarn medusa migrations run
```

---

### Problem: Storefront won't start

**Error: "Port 8000 already in use"**
```bash
# Kill process
lsof -ti:8000 | xargs kill -9

# Restart
yarn dev
```

**Error: "Cannot connect to backend"**
- Check backend is running on port 9000
- Check `.env.local` has correct BACKEND_URL
- Check CORS settings in backend `.env`

---

### Problem: No products showing

**In Admin Dashboard:**
```bash
# Re-run seed script
cd backend/my-medusa-store
yarn seed
```

**In Storefront:**
- Check backend is running
- Check API endpoint: http://localhost:9000/store/products
- Clear browser cache
- Restart storefront

---

### Problem: Can't login to admin

**Forgot password or user doesn't exist:**
```bash
cd backend/my-medusa-store

# Create new admin user
yarn medusa user --email admin@marqasouq.com --password admin123

# Or reset existing user (requires database access)
psql -U marqa_user -d marqa_souq_dev
```

---

### Problem: Database connection issues

**Check database exists:**
```bash
psql -l | grep marqa_souq_dev
```

**Check user has permissions:**
```bash
psql postgres
GRANT ALL PRIVILEGES ON DATABASE marqa_souq_dev TO marqa_user;
\q
```

**Test connection:**
```bash
psql -U marqa_user -d marqa_souq_dev -h localhost
# Enter password: marqa123
# Should connect successfully
```

---

## 🔄 RESET EVERYTHING (If Needed)

**If things are completely broken, start fresh:**

```bash
# 1. Stop all services (Ctrl+C in all terminals)

# 2. Drop database
dropdb marqa_souq_dev

# 3. Recreate database
createdb marqa_souq_dev

# 4. Clean backend
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
rm -rf node_modules
rm -rf .medusa
yarn install

# 5. Run migrations
yarn medusa migrations run

# 6. Create admin user
yarn medusa user --email admin@marqasouq.com --password admin123

# 7. Seed data
yarn seed

# 8. Start backend
yarn dev

# 9. In new terminal, clean storefront
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store-storefront
rm -rf node_modules
rm -rf .next
yarn install

# 10. Start storefront
yarn dev
```

**Time to complete:** ~15 minutes

---

## 📝 QUICK REFERENCE COMMANDS

**Start everything (3 terminals):**

```bash
# Terminal 1 - Backend
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
yarn dev

# Terminal 2 - Storefront
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store-storefront
yarn dev

# Terminal 3 - Commands
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
# Use for running commands like seed, migrations, etc.
```

**Essential URLs:**
- Admin: http://localhost:9000/app
- Storefront: http://localhost:8000
- API: http://localhost:9000/store/products

**Essential Credentials:**
- Email: admin@marqasouq.com
- Password: admin123

---

## 🎯 WHEN EVERYTHING WORKS

You should be able to:
1. ✅ Login to admin dashboard
2. ✅ See and manage products
3. ✅ View storefront
4. ✅ Browse products on storefront
5. ✅ Add products to cart
6. ✅ Access API endpoints

**Then you're ready to:**
- Start custom API development
- Follow `docs/QUICK_START_GUIDE.md`
- Build Brands API (Week 1, Day 1)

---

## 📞 NEXT STEPS AFTER VERIFICATION

Once everything is ✅:

1. **Read:** `docs/QUICK_START_GUIDE.md`
2. **Start:** Brands API development
3. **Follow:** Day-by-day implementation guide

---

**Good luck! Let me know when everything is verified and working! 🚀**
