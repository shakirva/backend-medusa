# MarqaSouq — Project Delivery Plan
## Odoo-Powered E-Commerce Platform

> **Date**: March 3, 2026  
> **Client**: MarqaSouq / Oskar LLC  
> **Stack**: Odoo ERP → MedusaJS 2.x Backend → Next.js Frontend  
> **Server**: 72.61.240.40 (PM2 managed)

---

## 🎯 PROJECT VISION

**Odoo is the single source of truth.** The client manages ALL product data (catalog, pricing, inventory, brands, images, variants) in Odoo. MarqaSouq website automatically reflects all changes via real-time sync + scheduled jobs.

---

## 📊 CURRENT STATUS

| Component | Status | Details |
|---|---|---|
| MedusaJS Backend | ✅ Running | Port 9000, PM2, PostgreSQL |
| Next.js Frontend | ✅ Running | Port 3000, PM2, bilingual EN/AR |
| Odoo Connection | ✅ Working | JSON-RPC authenticated |
| Basic Product Sync | ✅ Working | Name, SKU, price, stock, images |
| Category System | ✅ Working | With admin image management |
| Brand Module | ✅ Built | Custom Medusa module |
| Cart & Checkout | ✅ Working | KWD currency |
| Order → Odoo | ✅ Working | Auto-creates sale order in Odoo |
| Inventory Webhooks | ✅ Built | POST /odoo/webhooks/inventory |
| Order Status Webhooks | ✅ Built | POST /odoo/webhooks/order-status |
| Admin Dashboard | ✅ Working | Medusa admin at /app |
| **Full Product Field Sync** | 🔴 13% done | Only 10/79 fields synced |
| **Variant/Attribute Sync** | 🔴 Not started | No color/size options from Odoo |
| **SEO Fields** | 🔴 Not started | No meta titles/descriptions |
| **Cross-sell/Upsell** | 🔴 Not started | No related products from Odoo |
| **Rich Product Page** | 🔴 Partial | Missing brand, specs, ratings |

---

## 🗓️ DELIVERY PHASES

### ══════════════════════════════════════════════
### PHASE 1: Complete Product Sync Engine (Week 1)
### ══════════════════════════════════════════════

**Goal**: Sync ALL 38 critical Odoo fields → MedusaJS

#### Task 1.1: Enhanced Odoo Sync Service ⏱️ 2 days
- [ ] Update `OdooSyncService.fetchProducts()` to request all 60+ fields
- [ ] Update `OdooProduct` TypeScript interface with all fields
- [ ] Update `convertToMedusaProduct()` to map new fields to metadata
- [ ] Add `fetchProductImages()` — get `product_template_image_ids` gallery
- [ ] Add `fetchProductAttributes()` — get `attribute_line_ids` with values
- [ ] Add `fetchProductVariants()` — get individual variant data (SKU, price, stock per variant)
- [ ] Add `fetchRelatedProducts()` — resolve `optional_product_ids`, `accessory_product_ids`, `alternative_product_ids`
- [ ] Add `fetchVendors()` — resolve `seller_ids` to vendor names & prices
- [ ] Add `fetchBrands()` — resolve `brand_id` from `product.brand` model
- [ ] Handle currency conversion (Odoo OMR/AED → MedusaJS KWD)

#### Task 1.2: Full Product Import Script ⏱️ 1 day
- [ ] Create `sync-odoo-full.ts` — comprehensive sync that imports ALL fields
- [ ] Map `brand_id` → Medusa Brands module (auto-create brands)
- [ ] Map `categ_id` + `public_categ_ids` → Medusa categories (auto-create tree)
- [ ] Map `attribute_line_ids` → Medusa product options (Color, Size, etc.)
- [ ] Map `product_variant_ids` → Medusa variants (individual SKU/price/stock)
- [ ] Map `product_template_image_ids` → download & create gallery images
- [ ] Map `product_tag_ids` → Medusa product tags
- [ ] Map `is_published` → product status (published/draft)
- [ ] Map `seo_name` → product handle (URL slug)
- [ ] Store all extra fields in `product.metadata` JSON

#### Task 1.3: Scheduled Auto-Sync Jobs ⏱️ 1 day
- [ ] Update `odoo-sync-job.ts` — sync new/changed products every 5 minutes
- [ ] Update `odoo-inventory-sync-job.ts` — sync stock every 15 minutes
- [ ] Add `odoo-price-sync-job.ts` — sync price changes every 15 minutes
- [ ] Add `odoo-image-sync-job.ts` — sync new images every 30 minutes
- [ ] Add sync status dashboard in admin (`/admin/odoo-sync-status`)
- [ ] Add last-sync timestamps to track delta changes

#### Task 1.4: Real-time Webhooks ⏱️ 1 day
- [ ] Fix empty `products/route.ts` webhook — implement product create/update/delete
- [ ] Add webhook authentication (shared secret)
- [ ] Add webhook for price changes
- [ ] Add webhook for brand/category changes
- [ ] Test all webhooks with Odoo automated actions

**Phase 1 Deliverable**: Every Odoo product field is synced to MedusaJS. Products auto-sync on schedule. Real-time webhooks for instant updates.

---

### ══════════════════════════════════════════════
### PHASE 2: Rich Product Detail Page (Week 2)
### ══════════════════════════════════════════════

**Goal**: Frontend PDP shows ALL product data from Odoo

#### Task 2.1: Product Detail Page Enhancement ⏱️ 2 days
- [ ] **Brand Display**: Show brand logo + name from metadata.brand
- [ ] **Compare Price**: Show ~~original price~~ with discount % badge
- [ ] **Ribbon Badge**: Show "NEW" / "SALE" / "HOT DEAL" from metadata.ribbon
- [ ] **Rating Stars**: Show rating_avg as stars + rating_count reviews
- [ ] **Variant Selector**: Color/Size picker from product.options[]
- [ ] **Stock Status**: "In Stock" / "Only 3 left" / "Out of Stock" with OOS message
- [ ] **Lead Time**: "Delivery in X days" from metadata.lead_time_days
- [ ] **eCommerce Description**: Render rich HTML from metadata.ecommerce_description
- [ ] **Specifications Table**: Auto-generate from variant attributes
- [ ] **Image Gallery**: Multi-image carousel with zoom
- [ ] **Sold Count**: "1,234 sold" social proof from metadata.total_sold

#### Task 2.2: Cross-sell & Upsell Sections ⏱️ 1 day
- [ ] **"You May Also Like"**: Resolve optional_product_ids → product cards
- [ ] **"Frequently Bought Together"**: Resolve accessory_product_ids
- [ ] **"Compare With"**: Resolve alternative_product_ids
- [ ] Create API endpoint to resolve Odoo product IDs → Medusa products
- [ ] Design cross-sell UI components

#### Task 2.3: SEO Implementation ⏱️ 1 day
- [ ] Dynamic `<title>` from metadata.seo_title (fallback to product title)
- [ ] Dynamic `<meta description>` from metadata.seo_description
- [ ] Dynamic `<meta keywords>` from metadata.seo_keywords
- [ ] OpenGraph image from metadata.og_image
- [ ] Structured data (JSON-LD) for products
- [ ] Canonical URLs from Odoo seo_name
- [ ] Sitemap generation with all product URLs

#### Task 2.4: Product Listing Page Filters ⏱️ 1 day
- [ ] **Filter by Brand**: Dropdown with brand names from Odoo
- [ ] **Filter by Category/Sub-category**: Tree filter from categ_id hierarchy
- [ ] **Filter by Price Range**: Min-max slider
- [ ] **Filter by Rating**: Star rating filter
- [ ] **Filter by Availability**: In stock only toggle
- [ ] **Sort by**: Price, Rating, Newest, Best Selling (sales_count)
- [ ] **Search**: Full-text search across title, description, SKU, brand

**Phase 2 Deliverable**: Professional product pages with full Odoo data, cross-selling, SEO optimization, and advanced filtering.

---

### ══════════════════════════════════════════════
### PHASE 3: Order Flow & Customer Sync (Week 3)
### ══════════════════════════════════════════════

**Goal**: Bidirectional order & customer sync between MarqaSouq and Odoo

#### Task 3.1: Order Flow Perfection ⏱️ 2 days
- [ ] Verify order → Odoo sale order creation (existing subscriber)
- [ ] Ensure correct product matching by SKU in Odoo
- [ ] Sync order status back: Confirmed → Shipped → Delivered
- [ ] Add tracking number display on customer order page
- [ ] Handle order cancellation both ways
- [ ] Handle partial shipments
- [ ] Invoice generation link

#### Task 3.2: Customer Sync ⏱️ 1 day
- [ ] Sync customer registration → Odoo `res.partner`
- [ ] Sync customer addresses
- [ ] Sync customer order history
- [ ] Handle guest checkout customers

#### Task 3.3: Inventory Accuracy ⏱️ 1 day
- [ ] Real-time stock deduction on order placement
- [ ] Stock restoration on order cancellation
- [ ] Multi-warehouse support (if applicable)
- [ ] Low stock alerts (reordering rules from Odoo)
- [ ] "Only X left" display using available_threshold

#### Task 3.4: Payment Integration ⏱️ 1 day
- [ ] Verify KWD payment processing
- [ ] Cash on Delivery (COD) option
- [ ] Payment status sync to Odoo
- [ ] Refund handling

**Phase 3 Deliverable**: Complete order lifecycle managed from Odoo, real-time inventory sync, customer data in both systems.

---

### ══════════════════════════════════════════════
### PHASE 4: Admin Dashboard & Monitoring (Week 4)
### ══════════════════════════════════════════════

**Goal**: Client can monitor everything from Medusa Admin

#### Task 4.1: Odoo Sync Dashboard ⏱️ 1 day
- [ ] `/admin/odoo-sync` — Show sync status, last sync time, error count
- [ ] Manual "Sync Now" button for each data type
- [ ] Sync history log (last 100 syncs)
- [ ] Error details with retry option
- [ ] Product count comparison (Odoo vs Medusa)

#### Task 4.2: Product Quality Report ⏱️ 1 day
- [ ] Products missing images
- [ ] Products missing descriptions
- [ ] Products with zero stock
- [ ] Products missing prices
- [ ] Products missing SEO data
- [ ] Duplicate product detection

#### Task 4.3: Analytics Dashboard ⏱️ 1 day
- [ ] Orders per day/week/month
- [ ] Revenue tracking
- [ ] Top-selling products
- [ ] Category performance
- [ ] Brand performance
- [ ] Customer acquisition

#### Task 4.4: Production Hardening ⏱️ 2 days
- [ ] SSL certificate verification
- [ ] Rate limiting on APIs
- [ ] Error monitoring (Sentry or similar)
- [ ] Database backups automation
- [ ] PM2 cluster mode for high availability
- [ ] CDN for product images
- [ ] GZIP compression
- [ ] Security headers
- [ ] Load testing

**Phase 4 Deliverable**: Production-ready platform with monitoring, analytics, and operational tools.

---

## 📋 IMPLEMENTATION PRIORITY ORDER

### 🔴 DO FIRST (Blocks everything)
1. Update `OdooSyncService` — fetch ALL fields from Odoo
2. Build variant/attribute sync (Color, Size from `attribute_line_ids`)
3. Build multi-image gallery sync (`product_template_image_ids`)
4. Map `brand_id` → Brands module
5. Map `is_published` → product status
6. Map `compare_list_price` → compare price display

### 🟡 DO SECOND (Rich experience)
7. SEO fields sync (meta title, description, keywords)
8. Cross-sell/upsell product references
9. Rating/review data sync
10. Ribbon/badge display
11. Stock status & OOS message display
12. Product listing filters (brand, category, price)

### 🟢 DO THIRD (Polish & monitoring)
13. Admin sync dashboard
14. Webhook authentication
15. Product quality report
16. Analytics dashboard
17. Production hardening

---

## 🔧 FILES TO CREATE / MODIFY

### New Files
| File | Purpose |
|---|---|
| `src/scripts/sync-odoo-full.ts` | Complete product sync with ALL fields |
| `src/scripts/sync-odoo-brands.ts` | Sync brands from Odoo → Brands module |
| `src/scripts/sync-odoo-categories-full.ts` | Sync full category tree with `public_categ_ids` |
| `src/scripts/sync-odoo-variants.ts` | Sync attribute lines → options & variants |
| `src/jobs/odoo-price-sync-job.ts` | Scheduled price sync |
| `src/jobs/odoo-image-sync-job.ts` | Scheduled image sync |
| `src/api/odoo/webhooks/products/route.ts` | Product webhook (currently empty!) |
| `src/api/odoo/webhooks/prices/route.ts` | Price change webhook |
| `src/api/store/products/related/route.ts` | API to get cross-sell products |
| `src/admin/routes/odoo-sync/page.tsx` | Admin sync status dashboard |
| `frontend/src/components/VariantSelector.js` | Color/Size picker component |
| `frontend/src/components/CrossSellSection.js` | Related products section |
| `frontend/src/components/RatingStars.js` | Star rating component |
| `frontend/src/components/RibbonBadge.js` | NEW/SALE/HOT badge |
| `frontend/src/components/StockStatus.js` | Stock availability display |
| `docs/ODOO_PRODUCT_FIELD_MAPPING.md` | Field mapping reference (✅ Created) |

### Files to Modify
| File | Changes |
|---|---|
| `src/modules/odoo-sync/service.ts` | Add all new fields to fetch, new methods |
| `src/jobs/odoo-sync-job.ts` | Use full field list, better delta sync |
| `src/jobs/odoo-inventory-sync-job.ts` | Add forecasted, incoming, outgoing qty |
| `frontend/src/app/[lang]/products/[id]/page.js` | Add brand, rating, variants, cross-sell, SEO |
| `frontend/src/app/[lang]/products/page.js` | Add filters by brand, category, price, rating |
| `frontend/src/components/ProductCard.js` | Add ribbon badge, rating, compare price |
| `frontend/src/components/Header.js` | Brand menu section |
| `frontend/src/app/layout.js` | Dynamic SEO meta tags |

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Duration | Start | End |
|---|---|---|---|
| Phase 1: Complete Sync Engine | 5 days | Week 1 Mon | Week 1 Fri |
| Phase 2: Rich Product Pages | 5 days | Week 2 Mon | Week 2 Fri |
| Phase 3: Order & Customer Flow | 5 days | Week 3 Mon | Week 3 Fri |
| Phase 4: Admin & Production | 5 days | Week 4 Mon | Week 4 Fri |
| **TOTAL** | **4 weeks** | | |

---

## ✅ CLIENT ACCEPTANCE CRITERIA

### Must-Have for Delivery
- [ ] All Odoo products appear on MarqaSouq website within 5 minutes of publishing
- [ ] Product images, brand, category, price, stock sync automatically
- [ ] Variants (Color/Size) selectable on product page
- [ ] Compare price shows with discount percentage
- [ ] Orders placed on website appear in Odoo as sale orders
- [ ] Inventory updates in Odoo reflect on website within 15 minutes
- [ ] Product SEO meta data synced from Odoo
- [ ] Admin can see sync status and trigger manual sync
- [ ] Website works in both English and Arabic

### Nice-to-Have
- [ ] Cross-sell product recommendations from Odoo
- [ ] Customer accounts sync between systems
- [ ] Rating/review display
- [ ] Analytics dashboard
- [ ] CDN for images

---

## 🚀 NEXT IMMEDIATE ACTION

**Start with Phase 1, Task 1.1**: Update `OdooSyncService` to fetch ALL product fields.

Shall I begin implementation now?
