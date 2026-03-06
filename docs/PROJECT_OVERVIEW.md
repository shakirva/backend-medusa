# MarqaSouq - Complete Project Overview

## 🏗️ Architecture (Simple)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  Next.js 15  │     │ MedusaJS 2.x │     │   Database    │
│  Port: 3000  │     │  Port: 9000  │     │  Port: 5432   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │   Odoo ERP   │
                     │ (Products,   │
                     │  Images,     │
                     │  Inventory)  │
                     └──────────────┘
```

**3 main parts:**
1. **Frontend** — Next.js website (what customers see)
2. **Backend** — MedusaJS API + Admin Dashboard (manages orders, customers)
3. **Odoo ERP** — Source of ALL products, images & inventory (syncs to MedusaJS)

**Target Market:** Kuwait (KWD currency)

---

## 📊 Current Database Stats

| Item | Count |
|------|-------|
| Products (published) | 2,172 |
| Product Images | 86 |
| Categories | 267 |
| Collections | 9 (hot-deals, new-arrival, recommended, etc.) |
| Orders | 15 |
| Customers | 11 |
| Regions | 2 (Kuwait KWD, Europe EUR) |
| Payment Providers | 1 |
| Shipping Options | 3 (Standard, Express, Kuwait Standard) |
| Uploads Size | 47 MB |

---

## 🖥️ Frontend Pages (Next.js)

| Page | Status |
|------|--------|
| Homepage (banners, collections, products) | ✅ |
| Product Listing | ✅ |
| Product Detail (images, variants, specs) | ✅ |
| Categories | ✅ |
| Cart | ✅ |
| Checkout | ✅ |
| Login / Auth | ✅ |
| Account / Profile | ✅ |
| Orders | ✅ |
| Wishlist | ✅ |
| Search | ✅ |
| Blog | ✅ |
| Media Gallery | ✅ |
| Brands | ✅ |
| About / Privacy / Terms | ✅ |
| Support | ✅ |
| Warranty | ✅ |
| Become a Seller | ✅ |
| Shipping & Delivery Info | ✅ |

---

## 🔌 Backend API Endpoints

### Store APIs (for frontend/mobile)
- `/store/homepage` — Homepage data (banners + product collections)
- `/store/products` — Product listing, search, filter
- `/store/products/:id/details` — Full product detail
- `/store/products/:id/reviews` — Product reviews
- `/store/products/:id/qa` — Q&A
- `/store/categories/tree` — Category tree
- `/store/categories/:handle/products` — Products by category
- `/store/filter-options` — Filters (color, size, brand, price)
- `/store/brands` — Brand listing
- `/store/blog` — Blog posts
- `/store/media` — Media gallery
- `/store/pages/:slug` — Static pages (about, privacy, terms)
- `/store/wishlist` — Wishlist CRUD
- `/store/account/change-password` — Change password
- `/store/account/delete` — Delete account
- `/store/account/recently-viewed` — Recently viewed
- `/store/sellers` — Seller registration

### Odoo Integration APIs
- `/odoo/orders` — Sync orders to Odoo
- `/odoo/customers` — Sync customers
- `/odoo/inventory` — Inventory sync
- `/odoo/webhooks/order-status` — Webhook for order updates
- `/odoo/webhooks/inventory` — Webhook for stock updates

### Admin APIs
- `/admin/banners` — Manage homepage banners
- `/admin/brands` — Manage brands
- `/admin/blog` — Manage blog posts
- `/admin/media` — Manage media gallery
- `/admin/odoo` — Odoo sync management
- `/admin/reviews` — Review moderation
- `/admin/sellers` — Seller management

---

## 💾 Storage: Do You Need S3?

**NO. You do NOT need S3.**

**Why?** All product images are served directly from Odoo ERP via public URLs. We do NOT download or store product images on our server. When the frontend or admin needs an image, it loads directly from:
```
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.product/{odoo_id}/image_1920
```

**Image Strategy (Direct Odoo URLs):**
- ✅ Product images → Served directly from Odoo (zero storage on VPS)
- ✅ Gallery images → Served directly from Odoo
- ✅ Brand logos → Served directly from Odoo
- 📁 Banner images → Admin uploads (stored locally, very few)
- 📁 Media gallery files → Admin uploads (stored locally, very few)

**What's stored locally** (`/static/uploads/` — minimal):
- Banner images (admin uploads — very few)
- Media gallery files (admin uploads — very few)
- **NOT** product images — those come directly from Odoo

**Bottom line:** No S3, no local product image storage. Odoo is the single source of truth for all product images.

---

## 🚀 Deployment (Simple)

**You need a VPS (Hostinger) with:**
1. **PostgreSQL** — Database
2. **Node.js 20** — Runs both backend and frontend
3. **Nginx** — Reverse proxy
4. **PM2** — Keeps servers running

**Deploy steps:**
```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Clone repos
git clone https://github.com/shakirva/backend-medusa.git
git clone https://github.com/Zahidmk/markasouq-web.git

# 3. Install dependencies
cd backend-medusa && npm install
cd markasouq-web && npm install

# 4. Set environment variables (.env files)
# 5. Build frontend: npm run build
# 6. Start with PM2:
pm2 start ecosystem.config.js

# 7. Configure Nginx to proxy:
#    admin.markasouqs.com → localhost:9000
#    markasouqs.com → localhost:3000
```

**DNS Setup:**
- `markasouqs.com` → VPS IP (frontend)
- `admin.markasouqs.com` → VPS IP (backend/admin)

---

## 🔴 PENDING TASKS FOR LAUNCH (3 days)

### CRITICAL (Must Fix)
| # | Task | Priority | Time |
|---|------|----------|------|
| 1 | **Fix New Arrivals not showing on homepage** | 🔴 HIGH | 30 min |
| 2 | **Fix product images not loading** (Next.js Image 400 error) | 🔴 HIGH | 30 min |
| 3 | **Verify Kuwait region (KWD) is set correctly** — remove Europe region if not needed | 🔴 HIGH | 30 min |
| 4 | **Payment gateway integration** — only 1 provider, need real payment (KNET/Stripe) | 🔴 HIGH | 2-4 hrs |
| 5 | **Product prices are 0.000** — prices not synced from Odoo | 🔴 HIGH | 1-2 hrs |
| 6 | **Sync all product images from Odoo** — only 86 images for 2172 products | 🔴 HIGH | 2-3 hrs |

### IMPORTANT (Should Fix Before Launch)
| # | Task | Priority | Time |
|---|------|----------|------|
| 7 | **Checkout flow end-to-end test** — place a real order | 🟡 MED | 2 hrs |
| 8 | **Order confirmation email** — setup email provider (SendGrid/Resend) | 🟡 MED | 1-2 hrs |
| 9 | **Production .env files** — set correct URLs, API keys, DB credentials | 🟡 MED | 30 min |
| 10 | **SSL certificates** (Let's Encrypt) for HTTPS | 🟡 MED | 30 min |
| 11 | **Remove Europe region** — only Kuwait (KWD) is needed | 🟡 MED | 15 min |
| 12 | **Git push** — resolve package-lock.json conflict and push to GitHub | 🟡 MED | 15 min |

### NICE TO HAVE (Can Do After Launch)
| # | Task | Priority | Time |
|---|------|----------|------|
| 13 | SEO meta tags for all pages | 🟢 LOW | 2 hrs |
| 14 | Google Analytics integration | 🟢 LOW | 30 min |
| 15 | Push notifications (mobile) | 🟢 LOW | 4 hrs |
| 16 | CDN for faster image loading | 🟢 LOW | 1 hr |
| 17 | Rate limiting / security hardening | 🟢 LOW | 2 hrs |
| 18 | Odoo real-time inventory sync | 🟢 LOW | 4 hrs |

---

## 🔄 Data Flow (How It Works)

```
1. PRODUCTS: Odoo → Sync Script → MedusaJS DB → Store API → Frontend
2. ORDERS:   Customer → Frontend → MedusaJS → Odoo webhook
3. IMAGES:   Odoo direct URL → Stored in MedusaJS DB → Frontend loads from Odoo CDN
4. PAYMENTS: Customer → Frontend → MedusaJS → Payment Provider
```

---

## 📁 Folder Structure (Simple)

```
marqa-souq/medusa/
├── backend/my-medusa-store/     ← MedusaJS Backend
│   ├── src/
│   │   ├── api/                 ← All API routes
│   │   │   ├── store/           ← Customer-facing APIs
│   │   │   ├── admin/           ← Admin APIs
│   │   │   └── odoo/            ← Odoo integration APIs
│   │   ├── modules/             ← Custom modules (blog, brands, media, etc.)
│   │   ├── jobs/                ← Background jobs (Odoo sync)
│   │   ├── subscribers/         ← Event listeners
│   │   └── workflows/           ← Business logic workflows
│   ├── static/uploads/          ← Product images (47 MB)
│   └── .env                     ← Backend config
│
├── frontend/markasouq-web/      ← Next.js Frontend
│   ├── src/
│   │   ├── app/[lang]/          ← All pages (homepage, products, cart, etc.)
│   │   ├── components/          ← Reusable UI components
│   │   ├── lib/medusa.js        ← API client (talks to backend)
│   │   └── utils/               ← Helper functions
│   ├── public/                  ← Static assets (icons, banners)
│   └── .env.local               ← Frontend config
│
└── docs/                        ← Documentation
```

---

## ✅ What's Already Done

- ✅ 2,172 products synced from Odoo
- ✅ 267 categories created
- ✅ 9 collections (hot-deals, new-arrivals, recommended, etc.)
- ✅ Full admin dashboard with branding
- ✅ All store APIs working
- ✅ All Flutter/mobile APIs created
- ✅ Homepage with banners and sections
- ✅ Product detail page with variants, specs, Q&A
- ✅ Cart and checkout flow
- ✅ User auth (register, login, Google OAuth)
- ✅ Wishlist, reviews, blog, media gallery
- ✅ Odoo integration (orders, customers, inventory)
- ✅ Multi-language support (English/Arabic)
- ✅ Dark mode support
- ✅ Responsive design
