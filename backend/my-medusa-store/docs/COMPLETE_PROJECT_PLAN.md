# RunBazaar E-Commerce Platform - Complete Project Plan
**Project Manager's Guide**

**Project:** Marqa Souq - RunBazaar-style Marketplace  
**Tech Stack:** MedusaJS v2, Next.js, PostgreSQL, Odoo ERP  
**Start Date:** November 17, 2025  
**Target:** Production-ready multi-vendor marketplace  

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Project Architecture](#project-architecture)
3. [Development Phases](#development-phases)
4. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
5. [Phase 2: Custom API Development](#phase-2-custom-api-development)
6. [Phase 3: Odoo ERP Integration](#phase-3-odoo-erp-integration)
7. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
8. [Phase 5: Mobile App APIs](#phase-5-mobile-app-apis)
9. [Phase 6: Testing & QA](#phase-6-testing--qa)
10. [Phase 7: Deployment & Go-Live](#phase-7-deployment--go-live)
11. [Resource Allocation](#resource-allocation)
12. [Risk Management](#risk-management)
13. [Timeline & Milestones](#timeline--milestones)

---

## 1. PROJECT OVERVIEW

### 1.1 Business Objectives
- Build a scalable multi-vendor marketplace similar to RunBazaar
- Support 10,000+ products, 100+ sellers
- Enable B2C and B2B transactions
- Real-time inventory sync with Odoo ERP
- Mobile-first design with PWA capabilities
- Multi-language support (Arabic, English)

### 1.2 Key Features
✅ **Core E-commerce:** Products, Categories, Cart, Checkout, Orders  
✅ **Multi-vendor:** Seller registration, portal, commission management  
✅ **Brands:** Brand pages, filtering, featured brands  
✅ **Wishlist:** Save for later functionality  
✅ **Reviews & Ratings:** Product reviews with moderation  
✅ **Media Gallery:** Images, videos, 360° views  
✅ **Warranty Management:** Product warranties and claims  
✅ **Express Delivery:** Same-day, next-day shipping options  
✅ **Multi-language:** Arabic/English content  
✅ **Customer Support:** Live chat, tickets, FAQ  
✅ **Mobile App:** iOS/Android apps with push notifications  
✅ **Odoo Integration:** Real-time inventory, order sync  

### 1.3 Current Status
```
✅ Backend: MedusaJS v2.10.3 initialized
✅ Frontend: Next.js storefront initialized
✅ Database: PostgreSQL configured
✅ Admin Dashboard: Accessible
⏳ Custom APIs: Not started
⏳ Odoo Integration: Basic connector exists
⏳ Frontend Design: Awaiting RunBazaar design from frontend team
```

---

## 2. PROJECT ARCHITECTURE

### 2.1 Technology Stack

**Backend:**
- MedusaJS v2.10.3 (Node.js framework)
- PostgreSQL 14+ (primary database)
- Redis (caching, sessions)
- TypeScript 5.6+

**Frontend:**
- Next.js 14+ (React framework)
- TailwindCSS (styling)
- TypeScript
- Medusa JS SDK

**Integration Layer:**
- Python 3.10+ (Odoo connector)
- FastAPI (webhook receiver)
- Celery (async tasks)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- PM2 (process manager)
- GitHub Actions (CI/CD)

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
├─────────────────┬───────────────────┬──────────────────────┤
│  Next.js Web    │   Mobile App      │   Admin Dashboard    │
│  Storefront     │   (React Native)  │   (Medusa Admin)     │
└────────┬────────┴─────────┬─────────┴──────────┬───────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   NGINX Proxy    │
                   └────────┬─────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐     ┌──────▼──────┐    ┌─────▼─────┐
    │ MedusaJS │     │   Custom    │    │  Webhook  │
    │   Core   │     │   Modules   │    │  Service  │
    │   APIs   │     │   (Brands,  │    │  (Odoo)   │
    │          │     │  Wishlist)  │    │           │
    └────┬─────┘     └──────┬──────┘    └─────┬─────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   PostgreSQL     │
                   │   (Main DB)      │
                   └──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   Redis Cache    │
                   └──────────────────┘
                            
         ┌──────────────────────────────────────┐
         │      ODOO ERP INTEGRATION            │
         ├──────────────────────────────────────┤
         │  • Inventory Sync (hourly)           │
         │  • Order Sync (real-time)            │
         │  • Product Sync (daily)              │
         │  • Python Connector Service          │
         └──────────────────────────────────────┘
```

---

## 3. DEVELOPMENT PHASES

### Phase Overview

| Phase | Duration | Dependencies | Team Size |
|-------|----------|--------------|-----------|
| **Phase 1:** Foundation Setup | 1 week | None | 2 devs |
| **Phase 2:** Custom API Development | 4 weeks | Phase 1 | 3 devs |
| **Phase 3:** Odoo Integration | 2 weeks | Phase 2 | 2 devs |
| **Phase 4:** Frontend Integration | 3 weeks | Phase 2 | 2 frontend devs |
| **Phase 5:** Mobile App APIs | 2 weeks | Phase 2 | 1 dev |
| **Phase 6:** Testing & QA | 2 weeks | Phase 2-5 | 2 QA + 2 devs |
| **Phase 7:** Deployment | 1 week | Phase 6 | DevOps + PM |

**Total Timeline:** 15 weeks (~3.5 months)

---

## 4. PHASE 1: FOUNDATION SETUP
**Duration:** Week 1  
**Team:** 2 Backend Developers  

### 4.1 Environment Setup ✅ (Mostly Complete)

**Tasks:**
```bash
# Already completed:
✅ MedusaJS backend initialization
✅ Next.js storefront initialization  
✅ PostgreSQL database setup
✅ Basic folder structure

# Remaining tasks:
□ Redis installation and configuration
□ Docker Compose setup for all services
□ Environment variables consolidation
□ Git branching strategy (main, develop, feature/*)
□ CI/CD pipeline setup (GitHub Actions)
```

**Commands to Run:**

```bash
# 1. Start Backend (Terminal 1)
cd backend/my-medusa-store
yarn install
yarn dev
# Backend runs on: http://localhost:9000

# 2. Start Storefront (Terminal 2)
cd backend/my-medusa-store-storefront
yarn install
yarn dev
# Storefront runs on: http://localhost:8000

# 3. Create Admin User (Terminal 3)
cd backend/my-medusa-store
yarn medusa user --email admin@marqasouq.com --password admin123

# 4. Seed Sample Data
yarn seed

# 5. Access Admin Dashboard
# Open: http://localhost:9000/app
# Login: admin@marqasouq.com / admin123
```

### 4.2 Database Schema Planning

**Core Tables (MedusaJS Default):**
- products, product_variants
- categories, collections
- customers, addresses
- carts, line_items
- orders, fulfillments
- regions, shipping_options
- payment_sessions

**Custom Tables (To Create):**
- brands
- wishlists, wishlist_items
- reviews, review_images
- sellers, seller_products
- media_galleries
- warranties, warranty_claims
- translations (i18n)
- express_delivery_options
- support_tickets
- notifications

### 4.3 Development Standards

**Coding Standards:**
```typescript
// File naming: kebab-case
// brand-service.ts, wishlist-controller.ts

// Code style: ESLint + Prettier
// API versioning: /api/v1/custom/brands
// Error handling: Standardized error responses
// Logging: Winston or Pino
// Documentation: JSDoc for all functions
```

**Git Workflow:**
```bash
main (production)
  └── develop (staging)
       └── feature/brands-api
       └── feature/wishlist-api
       └── fix/cart-bug
```

**Deliverables:**
- ✅ All services running locally
- ✅ Admin dashboard accessible
- ✅ Sample data seeded
- ✅ Docker Compose configuration
- ✅ Development documentation
- ✅ Team onboarding guide

---

## 5. PHASE 2: CUSTOM API DEVELOPMENT
**Duration:** Weeks 2-5 (4 weeks)  
**Team:** 3 Backend Developers  

### 5.1 Development Approach

**Methodology:**
1. **Design:** API spec, data models
2. **Implement:** Models, services, routes
3. **Test:** Unit tests, integration tests
4. **Document:** API docs (Swagger/Postman)
5. **Review:** Code review, QA testing

**Priority Order:**
1. **Week 2:** Brands, Wishlist (most critical)
2. **Week 3:** Reviews, Seller Portal
3. **Week 4:** Media Gallery, Warranty
4. **Week 5:** Multi-language, Express Delivery, Support

---

### 5.2 WEEK 2: BRANDS & WISHLIST APIs

#### 5.2.1 Brands API Implementation

**Day 1-2: Data Model & Module Setup**

**File:** `backend/my-medusa-store/src/modules/brands/models/brand.ts`
```typescript
import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  banner_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  display_order: model.number().default(0),
})

export default Brand
```

**File:** `backend/my-medusa-store/src/modules/brands/index.ts`
```typescript
import { Module } from "@medusajs/framework/utils"
import BrandService from "./service"

export const BRAND_MODULE = "brandModuleService"

export default Module(BRAND_MODULE, {
  service: BrandService,
})
```

**Day 3-4: Service Layer**

**File:** `backend/my-medusa-store/src/modules/brands/service.ts`
```typescript
import { MedusaService } from "@medusajs/framework/utils"
import Brand from "./models/brand"

class BrandService extends MedusaService({ Brand }) {
  
  async createBrand(data: {
    name: string
    slug?: string
    description?: string
    logo_url?: string
  }) {
    const slug = data.slug || this.generateSlug(data.name)
    
    return await this.create({
      ...data,
      slug,
    })
  }

  async updateBrand(id: string, data: Partial<Brand>) {
    return await this.update(id, data)
  }

  async deleteBrand(id: string) {
    return await this.delete(id)
  }

  async listBrands(filters: any = {}) {
    return await this.list(filters)
  }

  async getBrandById(id: string) {
    return await this.retrieve(id)
  }

  async getBrandBySlug(slug: string) {
    return await this.list({ slug })
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

export default BrandService
```

**Day 5: API Routes**

**File:** `backend/my-medusa-store/src/api/store/brands/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../modules/brands"

// GET /store/brands
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  
  const brands = await brandService.listBrands({
    is_active: true,
  })
  
  res.json({ brands })
}
```

**File:** `backend/my-medusa-store/src/api/store/brands/[id]/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../../modules/brands"

// GET /store/brands/:id
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  
  const brand = await brandService.getBrandById(id)
  
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" })
  }
  
  res.json({ brand })
}
```

**File:** `backend/my-medusa-store/src/api/admin/brands/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../modules/brands"

// GET /admin/brands
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands()
  res.json({ brands })
}

// POST /admin/brands
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.createBrand(req.body)
  res.status(201).json({ brand })
}
```

**File:** `backend/my-medusa-store/src/api/admin/brands/[id]/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../../modules/brands"

// PUT /admin/brands/:id
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  const brand = await brandService.updateBrand(id, req.body)
  res.json({ brand })
}

// DELETE /admin/brands/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  await brandService.deleteBrand(id)
  res.status(204).send()
}
```

**Testing:**
```bash
# Test with curl or Postman
curl http://localhost:9000/store/brands
curl http://localhost:9000/admin/brands -H "Authorization: Bearer <token>"
```

---

#### 5.2.2 Wishlist API Implementation

**Day 6-7: Data Model**

**File:** `backend/my-medusa-store/src/modules/wishlist/models/wishlist.ts`
```typescript
import { model } from "@medusajs/framework/utils"

const Wishlist = model.define("wishlist", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
})

const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  wishlist_id: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
})

export { Wishlist, WishlistItem }
```

**File:** `backend/my-medusa-store/src/modules/wishlist/service.ts`
```typescript
import { MedusaService } from "@medusajs/framework/utils"
import { Wishlist, WishlistItem } from "./models/wishlist"

class WishlistService extends MedusaService({ Wishlist, WishlistItem }) {
  
  async getOrCreateWishlist(customerId: string) {
    let wishlist = await this.Wishlist.list({ customer_id: customerId })
    
    if (wishlist.length === 0) {
      wishlist = await this.Wishlist.create({ customer_id: customerId })
    }
    
    return wishlist[0]
  }

  async addItem(customerId: string, productId: string, variantId?: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    
    // Check if item already exists
    const existing = await this.WishlistItem.list({
      wishlist_id: wishlist.id,
      product_id: productId,
    })
    
    if (existing.length > 0) {
      throw new Error("Item already in wishlist")
    }
    
    return await this.WishlistItem.create({
      wishlist_id: wishlist.id,
      product_id: productId,
      variant_id: variantId,
    })
  }

  async removeItem(customerId: string, itemId: string) {
    return await this.WishlistItem.delete(itemId)
  }

  async getWishlistItems(customerId: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    return await this.WishlistItem.list({ wishlist_id: wishlist.id })
  }
}

export default WishlistService
```

**API Routes:** Similar structure to Brands API

---

### 5.3 WEEK 3: REVIEWS & SELLER PORTAL

#### 5.3.1 Reviews API

**Data Model:**
```typescript
// backend/my-medusa-store/src/modules/reviews/models/review.ts
const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  rating: model.number(), // 1-5
  title: model.text().nullable(),
  comment: model.text(),
  is_verified_purchase: model.boolean().default(false),
  is_approved: model.boolean().default(false),
  helpful_count: model.number().default(0),
})

const ReviewImage = model.define("review_image", {
  id: model.id().primaryKey(),
  review_id: model.text(),
  image_url: model.text(),
})
```

**Key Features:**
- Star ratings (1-5)
- Review moderation (admin approval)
- Verified purchase badge
- Image uploads
- Helpful votes
- Response from seller

---

#### 5.3.2 Seller Portal API

**Data Model:**
```typescript
// backend/my-medusa-store/src/modules/sellers/models/seller.ts
const Seller = model.define("seller", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().unique(),
  phone: model.text().nullable(),
  company_name: model.text(),
  tax_id: model.text().nullable(),
  is_active: model.boolean().default(false),
  is_verified: model.boolean().default(false),
  commission_rate: model.number().default(10), // percentage
  total_sales: model.number().default(0),
  rating: model.number().default(0),
})

const SellerProduct = model.define("seller_product", {
  id: model.id().primaryKey(),
  seller_id: model.text(),
  product_id: model.text(),
  stock_quantity: model.number().default(0),
  seller_sku: model.text().nullable(),
})
```

**Key Endpoints:**
```
Admin:
- GET /admin/sellers (list all sellers)
- POST /admin/sellers (create seller)
- PUT /admin/sellers/:id (update seller)
- PUT /admin/sellers/:id/verify (verify seller)
- DELETE /admin/sellers/:id

Seller Portal:
- GET /seller/dashboard (sales stats)
- GET /seller/products (my products)
- POST /seller/products (add product)
- GET /seller/orders (my orders)
- PUT /seller/orders/:id/fulfill
```

---

### 5.4 WEEK 4: MEDIA GALLERY & WARRANTY

#### 5.4.1 Media Gallery API

**Purpose:** Enhanced product media (videos, 360° views, galleries)

**Data Model:**
```typescript
const MediaGallery = model.define("media_gallery", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  media_type: model.enum(["image", "video", "360"]),
  url: model.text(),
  thumbnail_url: model.text().nullable(),
  display_order: model.number().default(0),
  alt_text: model.text().nullable(),
})
```

---

#### 5.4.2 Warranty API

**Data Model:**
```typescript
const Warranty = model.define("warranty", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  duration_months: model.number(),
  type: model.enum(["manufacturer", "seller", "extended"]),
  terms: model.text(),
})

const WarrantyClaim = model.define("warranty_claim", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  product_id: model.text(),
  customer_id: model.text(),
  status: model.enum(["pending", "approved", "rejected", "completed"]),
  issue_description: model.text(),
})
```

---

### 5.5 WEEK 5: MULTI-LANGUAGE, EXPRESS DELIVERY, SUPPORT

#### 5.5.1 Multi-language (i18n) API

**Data Model:**
```typescript
const Translation = model.define("translation", {
  id: model.id().primaryKey(),
  entity_type: model.enum(["product", "category", "brand"]),
  entity_id: model.text(),
  locale: model.text(), // 'en', 'ar'
  field: model.text(), // 'name', 'description'
  value: model.text(),
})
```

**Endpoints:**
```
GET /store/i18n/product/:id?locale=ar
POST /admin/i18n/product/:id (add translation)
```

---

#### 5.5.2 Express Delivery API

**Data Model:**
```typescript
const ExpressDeliveryOption = model.define("express_delivery", {
  id: model.id().primaryKey(),
  name: model.text(), // "Same Day", "Next Day"
  delivery_time: model.text(), // "Within 4 hours"
  additional_cost: model.number(),
  available_regions: model.json(),
  cutoff_time: model.text(), // "14:00"
})
```

---

#### 5.5.3 Customer Support API

**Data Model:**
```typescript
const SupportTicket = model.define("support_ticket", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  order_id: model.text().nullable(),
  subject: model.text(),
  description: model.text(),
  status: model.enum(["open", "pending", "resolved", "closed"]),
  priority: model.enum(["low", "medium", "high"]),
})

const SupportMessage = model.define("support_message", {
  id: model.id().primaryKey(),
  ticket_id: model.text(),
  sender_type: model.enum(["customer", "admin"]),
  message: model.text(),
})
```

---

### 5.6 API Testing Checklist

**For Each API Module:**
```
□ Unit tests (service layer)
□ Integration tests (API routes)
□ Postman collection created
□ API documentation written
□ Error handling tested
□ Authentication/authorization tested
□ Performance tested (load testing)
□ Security audit (SQL injection, XSS)
```

**Test Data:**
```bash
# Create test data for each module
yarn test:seed:brands
yarn test:seed:wishlists
yarn test:seed:reviews
```

---

## 6. PHASE 3: ODOO ERP INTEGRATION
**Duration:** Weeks 6-7 (2 weeks)  
**Team:** 1 Backend Developer + 1 Python Developer  

### 6.1 Integration Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   MedusaJS   │◄────────┤    Python    │────────►│  Odoo ERP    │
│   Backend    │  Webhook│  Connector   │  XML-RPC│   System     │
└──────────────┘         └──────────────┘         └──────────────┘
     │                          │
     │  PostgreSQL              │  Logs/Queue
     ▼                          ▼
┌──────────────┐         ┌──────────────┐
│   Database   │         │    Redis     │
└──────────────┘         └──────────────┘
```

### 6.2 Data Sync Strategy

**Inventory Sync (Odoo → Medusa):**
- **Frequency:** Every 1 hour (configurable)
- **Method:** Pull from Odoo, update Medusa
- **Data:** Stock levels, prices, product info

**Order Sync (Medusa → Odoo):**
- **Frequency:** Real-time (webhook on order creation)
- **Method:** Push to Odoo
- **Data:** Order details, customer info, line items

**Product Sync (Odoo → Medusa):**
- **Frequency:** Daily at 2 AM
- **Method:** Pull from Odoo
- **Data:** New products, updates, images

### 6.3 Implementation

**Week 6: Odoo Connector Service**

**File:** `odoo-integration/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

ODOO_URL = os.getenv("ODOO_URL", "http://localhost:8069")
ODOO_DB = os.getenv("ODOO_DB", "odoo_db")
ODOO_USERNAME = os.getenv("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD", "admin")

MEDUSA_API_URL = os.getenv("MEDUSA_API_URL", "http://localhost:9000")
MEDUSA_API_KEY = os.getenv("MEDUSA_API_KEY")

SYNC_INTERVAL_HOURS = int(os.getenv("SYNC_INTERVAL_HOURS", "1"))
```

**File:** `odoo-integration/services/inventory_sync.py`
```python
import xmlrpc.client
import requests
from config import *

class InventorySync:
    def __init__(self):
        self.odoo_common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        self.odoo_models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')
        self.uid = self.odoo_common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
    
    def sync_inventory(self):
        """Sync inventory from Odoo to Medusa"""
        print("Starting inventory sync...")
        
        # Get products from Odoo
        products = self.odoo_models.execute_kw(
            ODOO_DB, self.uid, ODOO_PASSWORD,
            'product.product', 'search_read',
            [[['type', '=', 'product']]],
            {'fields': ['id', 'default_code', 'qty_available', 'list_price']}
        )
        
        for product in products:
            sku = product['default_code']
            quantity = product['qty_available']
            price = product['list_price']
            
            # Update in Medusa
            self.update_medusa_inventory(sku, quantity, price)
        
        print(f"Synced {len(products)} products")
    
    def update_medusa_inventory(self, sku, quantity, price):
        """Update inventory in Medusa"""
        # Find product variant by SKU
        response = requests.get(
            f"{MEDUSA_API_URL}/admin/products",
            params={"sku": sku},
            headers={"Authorization": f"Bearer {MEDUSA_API_KEY}"}
        )
        
        if response.status_code == 200:
            products = response.json().get('products', [])
            if products:
                product_id = products[0]['id']
                variant_id = products[0]['variants'][0]['id']
                
                # Update inventory
                requests.post(
                    f"{MEDUSA_API_URL}/admin/inventory-items/{variant_id}/location-levels",
                    json={"stocked_quantity": quantity},
                    headers={"Authorization": f"Bearer {MEDUSA_API_KEY}"}
                )

if __name__ == "__main__":
    sync = InventorySync()
    sync.sync_inventory()
```

**File:** `odoo-integration/services/order_sync.py`
```python
class OrderSync:
    def push_order_to_odoo(self, medusa_order):
        """Push Medusa order to Odoo"""
        # Create sale order in Odoo
        partner_id = self.get_or_create_partner(medusa_order['customer'])
        
        order_lines = []
        for item in medusa_order['items']:
            product_id = self.get_odoo_product_id(item['variant']['sku'])
            order_lines.append((0, 0, {
                'product_id': product_id,
                'product_uom_qty': item['quantity'],
                'price_unit': item['unit_price'] / 100,  # Convert cents to dollars
            }))
        
        sale_order_id = self.odoo_models.execute_kw(
            ODOO_DB, self.uid, ODOO_PASSWORD,
            'sale.order', 'create',
            [{
                'partner_id': partner_id,
                'order_line': order_lines,
                'client_order_ref': medusa_order['display_id'],
            }]
        )
        
        # Confirm the order
        self.odoo_models.execute_kw(
            ODOO_DB, self.uid, ODOO_PASSWORD,
            'sale.order', 'action_confirm',
            [[sale_order_id]]
        )
        
        return sale_order_id
```

**Week 7: Webhook & Scheduler**

**File:** `odoo-integration/webhook_receiver.py`
```python
from fastapi import FastAPI, Request
from services.order_sync import OrderSync

app = FastAPI()
order_sync = OrderSync()

@app.post("/webhook/order-created")
async def order_created(request: Request):
    """Receive order creation webhook from Medusa"""
    payload = await request.json()
    order_id = payload.get('id')
    
    # Fetch full order details from Medusa
    order = fetch_medusa_order(order_id)
    
    # Push to Odoo
    odoo_order_id = order_sync.push_order_to_odoo(order)
    
    return {"status": "success", "odoo_order_id": odoo_order_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

**File:** `odoo-integration/scheduler.py`
```python
from apscheduler.schedulers.blocking import BlockingScheduler
from services.inventory_sync import InventorySync
from services.product_sync import ProductSync

scheduler = BlockingScheduler()
inventory_sync = InventorySync()
product_sync = ProductSync()

@scheduler.scheduled_job('interval', hours=1)
def sync_inventory_job():
    inventory_sync.sync_inventory()

@scheduler.scheduled_job('cron', hour=2)
def sync_products_job():
    product_sync.sync_products()

if __name__ == "__main__":
    print("Starting Odoo sync scheduler...")
    scheduler.start()
```

**Docker Setup:**

**File:** `odoo-integration/Dockerfile`
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "scheduler.py"]
```

**File:** `odoo-integration/requirements.txt`
```
fastapi==0.104.1
uvicorn==0.24.0
requests==2.31.0
APScheduler==3.10.4
python-dotenv==1.0.0
redis==5.0.1
```

### 6.4 Testing Odoo Integration

```bash
# Test inventory sync
python odoo-integration/services/inventory_sync.py

# Test order sync
curl -X POST http://localhost:8001/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{"id": "order_123"}'

# Start scheduler
python odoo-integration/scheduler.py
```

---

## 7. PHASE 4: FRONTEND INTEGRATION
**Duration:** Weeks 8-10 (3 weeks)  
**Team:** 2 Frontend Developers  

### 7.1 Prerequisites

**From Frontend Team:**
- ✅ RunBazaar design files (Figma/Sketch)
- ✅ HTML/CSS/React components
- ✅ Design system (colors, fonts, spacing)
- ✅ Mobile responsive designs

### 7.2 Frontend Architecture

**File Structure:**
```
backend/my-medusa-store-storefront/
├── src/
│   ├── app/
│   │   ├── [countryCode]/
│   │   │   ├── (main)/
│   │   │   │   ├── page.tsx (Home)
│   │   │   │   ├── products/[id]/page.tsx
│   │   │   │   ├── brands/page.tsx
│   │   │   │   ├── brands/[slug]/page.tsx
│   │   │   │   ├── categories/[slug]/page.tsx
│   │   │   │   ├── wishlist/page.tsx
│   │   │   │   ├── account/page.tsx
│   │   │   ├── (checkout)/
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   ├── lib/
│   │   ├── data/
│   │   │   ├── brands.ts (NEW)
│   │   │   ├── wishlist.ts (NEW)
│   │   │   ├── reviews.ts (NEW)
│   ├── modules/
│   │   ├── brands/ (NEW)
│   │   ├── wishlist/ (NEW)
│   │   ├── reviews/ (NEW)
```

### 7.3 Week 8: Core Pages Integration

**Task Breakdown:**

**Day 1-2: Home Page**
```typescript
// src/app/[countryCode]/(main)/page.tsx
import { getFeaturedProducts } from "@/lib/data/products"
import { getFeaturedBrands } from "@/lib/data/brands"
import HeroSection from "@/modules/home/components/hero"
import BrandCarousel from "@/modules/brands/components/carousel"

export default async function Home() {
  const products = await getFeaturedProducts()
  const brands = await getFeaturedBrands()
  
  return (
    <>
      <HeroSection />
      <BrandCarousel brands={brands} />
      <FeaturedProducts products={products} />
      <PromoBanner />
    </>
  )
}
```

**Day 3-4: Brand Pages**
```typescript
// src/lib/data/brands.ts
import { sdk } from "@/lib/config"

export async function getBrands() {
  const response = await fetch("http://localhost:9000/store/brands")
  return response.json()
}

export async function getBrandBySlug(slug: string) {
  const response = await fetch(`http://localhost:9000/store/brands/${slug}`)
  return response.json()
}

// src/app/[countryCode]/(main)/brands/[slug]/page.tsx
import { getBrandBySlug } from "@/lib/data/brands"
import { getProductsByBrand } from "@/lib/data/products"

export default async function BrandPage({ params }) {
  const brand = await getBrandBySlug(params.slug)
  const products = await getProductsByBrand(brand.id)
  
  return (
    <div>
      <BrandHeader brand={brand} />
      <ProductGrid products={products} />
    </div>
  )
}
```

**Day 5: Wishlist Integration**
```typescript
// src/lib/data/wishlist.ts
export async function getWishlist() {
  const token = getAuthToken()
  const response = await fetch("http://localhost:9000/store/wishlist", {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export async function addToWishlist(productId: string) {
  const token = getAuthToken()
  return fetch("http://localhost:9000/store/wishlist", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ product_id: productId })
  })
}

// src/modules/wishlist/components/wishlist-button.tsx
"use client"
import { useState } from "react"
import { addToWishlist } from "@/lib/data/wishlist"

export default function WishlistButton({ productId }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  
  const handleClick = async () => {
    await addToWishlist(productId)
    setIsInWishlist(true)
  }
  
  return (
    <button onClick={handleClick}>
      {isInWishlist ? "❤️ Saved" : "🤍 Save"}
    </button>
  )
}
```

### 7.4 Week 9: Advanced Features

**Product Reviews:**
```typescript
// src/modules/products/components/reviews-section.tsx
import { getProductReviews } from "@/lib/data/reviews"

export default async function ReviewsSection({ productId }) {
  const reviews = await getProductReviews(productId)
  
  return (
    <div>
      <h3>Customer Reviews ({reviews.length})</h3>
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
      <AddReviewForm productId={productId} />
    </div>
  )
}
```

**Seller Information:**
```typescript
// src/modules/products/components/seller-info.tsx
export default function SellerInfo({ seller }) {
  return (
    <div className="border p-4 rounded">
      <h4>Sold by: {seller.name}</h4>
      <div className="flex items-center gap-2">
        <span>⭐ {seller.rating}</span>
        <span>({seller.total_sales} sales)</span>
      </div>
      <a href={`/sellers/${seller.id}`}>Visit Store →</a>
    </div>
  )
}
```

### 7.5 Week 10: Mobile Optimization & PWA

**PWA Configuration:**

**File:** `backend/my-medusa-store-storefront/public/manifest.json`
```json
{
  "name": "Marqa Souq",
  "short_name": "Marqa Souq",
  "description": "Premium Omani Marketplace",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker:**
```typescript
// src/app/layout.tsx
export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#000000",
}
```

---

## 8. PHASE 5: MOBILE APP APIs
**Duration:** Weeks 11-12 (2 weeks)  
**Team:** 1 Backend Developer  

### 8.1 Push Notifications API

**Data Model:**
```typescript
const Notification = model.define("notification", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  title: model.text(),
  body: model.text(),
  type: model.enum(["order", "promo", "general"]),
  data: model.json(),
  is_read: model.boolean().default(false),
  sent_at: model.dateTime(),
})
```

**Endpoints:**
```
POST /store/mobile/notifications/register-device
  - Register FCM token

POST /admin/notifications/send
  - Send push notification

GET /store/mobile/notifications
  - Get user notifications
```

### 8.2 Mobile Home API

**Optimized Endpoint:**
```typescript
// GET /store/mobile/home
{
  "banners": [...],
  "featured_products": [...],
  "featured_brands": [...],
  "flash_sales": [...],
  "categories": [...]
}
```

---

## 9. PHASE 6: TESTING & QA
**Duration:** Weeks 13-14 (2 weeks)  
**Team:** 2 QA Engineers + 2 Developers  

### 9.1 Testing Strategy

**Unit Tests:**
```bash
# Backend services
cd backend/my-medusa-store
yarn test:unit

# Coverage target: 80%
```

**Integration Tests:**
```bash
# API endpoints
yarn test:integration:http

# Test scenarios:
- Create brand
- Add to wishlist
- Submit review
- Complete checkout
```

**E2E Tests:**
```bash
# Using Playwright
cd backend/my-medusa-store-storefront
yarn playwright test

# Test flows:
- User registration → Browse → Add to cart → Checkout
- Seller registration → Add product → Manage orders
```

### 9.2 Performance Testing

**Load Testing:**
```bash
# Using Artillery
artillery run load-test.yml

# Targets:
- 1000 concurrent users
- Response time < 200ms (95th percentile)
- Error rate < 0.1%
```

### 9.3 Security Testing

**Checklist:**
```
□ SQL injection testing
□ XSS vulnerability scan
□ CSRF protection
□ Authentication/authorization
□ Rate limiting
□ Data encryption (in transit, at rest)
□ PCI DSS compliance (for payments)
```

---

## 10. PHASE 7: DEPLOYMENT & GO-LIVE
**Duration:** Week 15 (1 week)  
**Team:** DevOps Engineer + PM  

### 10.1 Infrastructure Setup

**Production Environment:**
```
Cloud Provider: AWS / DigitalOcean / Azure
- EC2/Droplet: t3.medium (Backend)
- RDS: PostgreSQL 14 (db.t3.medium)
- Redis: ElastiCache (cache.t3.micro)
- S3: Media storage
- CloudFront: CDN
- Load Balancer: Application LB
```

### 10.2 Deployment Checklist

```
□ Domain setup (marqasouq.com)
□ SSL certificate (Let's Encrypt/ACM)
□ Database migration
□ Environment variables configured
□ Docker containers built
□ Load balancer configured
□ CDN configured
□ Monitoring setup (Datadog/New Relic)
□ Logging setup (ELK stack)
□ Backup strategy implemented
□ Disaster recovery plan
```

### 10.3 Docker Compose Production

**File:** `deployment/docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: marqa_souq_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  medusa-backend:
    build: ../backend/my-medusa-store
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/marqa_souq_prod
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      COOKIE_SECRET: ${COOKIE_SECRET}
    ports:
      - "9000:9000"
    depends_on:
      - postgres
      - redis
    restart: always

  storefront:
    build: ../backend/my-medusa-store-storefront
    environment:
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: https://api.marqasouq.com
    ports:
      - "3000:3000"
    restart: always

  odoo-connector:
    build: ../odoo-integration
    environment:
      ODOO_URL: ${ODOO_URL}
      ODOO_DB: ${ODOO_DB}
      MEDUSA_API_URL: http://medusa-backend:9000
    restart: always

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - medusa-backend
      - storefront
    restart: always

volumes:
  postgres_data:
```

### 10.4 Deployment Commands

```bash
# Build and deploy
cd deployment
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec medusa-backend yarn medusa migrations run

# Create admin user
docker-compose exec medusa-backend yarn medusa user --email admin@marqasouq.com

# Monitor logs
docker-compose logs -f
```

---

## 11. RESOURCE ALLOCATION

### 11.1 Team Structure

**Backend Team (3 developers):**
- **Senior Backend Dev:** Custom modules, architecture
- **Mid-level Backend Dev:** API implementation, testing
- **Junior Backend Dev:** Documentation, bug fixes

**Frontend Team (2 developers):**
- **Senior Frontend Dev:** Component architecture, state management
- **Mid-level Frontend Dev:** Page implementation, styling

**Integration Team (2 developers):**
- **Python Developer:** Odoo connector
- **Backend Developer:** Webhook setup, data sync

**QA Team (2 engineers):**
- **QA Lead:** Test strategy, automation
- **QA Engineer:** Manual testing, bug reporting

**DevOps (1 engineer):**
- Infrastructure, CI/CD, monitoring

**Project Manager (1):**
- Planning, coordination, stakeholder communication

### 11.2 Estimated Costs

**Development Costs:**
```
Backend Team: 3 devs × $50/hr × 320 hrs = $48,000
Frontend Team: 2 devs × $45/hr × 240 hrs = $21,600
QA Team: 2 engineers × $35/hr × 160 hrs = $11,200
DevOps: 1 engineer × $60/hr × 80 hrs = $4,800
PM: 1 PM × $70/hr × 300 hrs = $21,000

Total Development: $106,600
```

**Infrastructure Costs (Monthly):**
```
AWS EC2 (t3.medium): $50
RDS PostgreSQL: $80
Redis ElastiCache: $30
S3 Storage: $20
CloudFront CDN: $50
Domain & SSL: $15

Total Monthly: $245
Annual: $2,940
```

---

## 12. RISK MANAGEMENT

### 12.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| MedusaJS v2 instability | High | Medium | Thorough testing, fallback plans |
| Odoo API changes | Medium | Low | Version pinning, comprehensive tests |
| Performance issues | High | Medium | Load testing, caching strategy |
| Data sync failures | High | Medium | Robust error handling, retry logic |
| Security vulnerabilities | High | Low | Security audits, penetration testing |

### 12.2 Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | High | Strict change control process |
| Frontend design delays | Medium | Medium | Early design review, parallel work |
| Resource unavailability | Medium | Low | Cross-training, documentation |
| Timeline slippage | High | Medium | Buffer time, agile sprints |

---

## 13. TIMELINE & MILESTONES

### 13.1 Gantt Chart Overview

```
Week 1:  [====] Foundation Setup
Week 2:  [====] Brands & Wishlist APIs
Week 3:  [====] Reviews & Seller Portal
Week 4:  [====] Media & Warranty
Week 5:  [====] i18n, Express Delivery, Support
Week 6:  [====] Odoo Connector Development
Week 7:  [====] Odoo Testing & Integration
Week 8:  [====] Frontend Core Pages
Week 9:  [====] Frontend Advanced Features
Week 10: [====] Mobile Optimization & PWA
Week 11: [====] Mobile App APIs
Week 12: [====] Mobile App Testing
Week 13: [====] Integration Testing
Week 14: [====] QA & Bug Fixes
Week 15: [====] Deployment & Go-Live
```

### 13.2 Key Milestones

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| **M1:** Environment Ready | Week 1 | All services running locally |
| **M2:** Custom APIs Complete | Week 5 | All 10 custom APIs implemented |
| **M3:** Odoo Integration Live | Week 7 | Real-time sync working |
| **M4:** Frontend Beta | Week 10 | All pages implemented |
| **M5:** Mobile APIs Ready | Week 12 | Push notifications working |
| **M6:** QA Signoff | Week 14 | All tests passed |
| **M7:** Production Launch | Week 15 | Live on marqasouq.com |

---

## 14. DAILY DEVELOPMENT WORKFLOW

### 14.1 Daily Routine

**Morning (9:00 AM - 12:00 PM):**
```bash
# 1. Pull latest changes
git checkout develop
git pull origin develop

# 2. Start services
cd backend/my-medusa-store
yarn dev  # Terminal 1

cd backend/my-medusa-store-storefront
yarn dev  # Terminal 2

# 3. Check admin dashboard
# http://localhost:9000/app

# 4. Daily standup (15 min)
- What I did yesterday
- What I'll do today
- Any blockers
```

**Afternoon (1:00 PM - 5:00 PM):**
```
- Feature implementation
- Code reviews
- Testing
- Documentation
```

**Evening (Before EOD):**
```bash
# 1. Commit changes
git add .
git commit -m "feat: implement brands API endpoints"

# 2. Push to feature branch
git push origin feature/brands-api

# 3. Create PR
# Review checklist:
□ Tests added
□ Documentation updated
□ No console errors
□ Code formatted
```

### 14.2 Code Review Checklist

**For Reviewers:**
```
□ Code follows project standards
□ No security vulnerabilities
□ Proper error handling
□ Tests included and passing
□ Documentation clear
□ Performance considerations
□ No breaking changes
□ API contracts maintained
```

---

## 15. MONITORING & MAINTENANCE

### 15.1 Post-Launch Monitoring

**Application Monitoring:**
- **Tool:** Datadog / New Relic
- **Metrics:** Response time, error rate, throughput
- **Alerts:** Email/Slack for critical issues

**Infrastructure Monitoring:**
- **Tool:** AWS CloudWatch
- **Metrics:** CPU, memory, disk, network
- **Alerts:** Auto-scaling triggers

**Business Metrics:**
- Orders per day
- Conversion rate
- Average order value
- Top-selling products/brands
- Customer retention

### 15.2 Maintenance Plan

**Daily:**
- Monitor error logs
- Check Odoo sync status
- Review customer support tickets

**Weekly:**
- Database backup verification
- Performance report
- Security patch check

**Monthly:**
- Dependency updates
- Security audit
- Capacity planning review

---

## 16. SUCCESS CRITERIA

### 16.1 Technical KPIs

```
✓ 99.9% uptime
✓ < 200ms average response time
✓ Zero critical security vulnerabilities
✓ 100% API endpoint coverage
✓ 80%+ test coverage
✓ < 0.1% error rate
```

### 16.2 Business KPIs

```
✓ 1,000+ products listed
✓ 50+ active sellers
✓ 10,000+ registered customers (Year 1)
✓ $100K+ GMV/month (Month 6)
✓ 4.5+ star average rating
✓ < 5% cart abandonment rate
```

---

## 17. NEXT STEPS (IMMEDIATE ACTIONS)

### Week 1 - Day 1 (Tomorrow):

**Morning:**
1. ✅ Verify all services are running
   ```bash
   cd backend/my-medusa-store && yarn dev
   cd backend/my-medusa-store-storefront && yarn dev
   ```

2. ✅ Access admin dashboard
   ```
   URL: http://localhost:9000/app
   Login: admin@marqasouq.com / admin123
   ```

3. ✅ Seed sample data
   ```bash
   yarn seed
   ```

**Afternoon:**
4. ⏳ Start Brands API development
   - Create module structure
   - Define data models
   - Implement service layer

5. ⏳ Set up Git workflow
   ```bash
   git checkout -b feature/brands-api
   ```

6. ⏳ Schedule team kickoff meeting
   - Review project plan
   - Assign initial tasks
   - Set up communication channels

---

## 18. APPENDICES

### Appendix A: API Endpoint Reference

**Complete list of endpoints (100+ endpoints)**

**MedusaJS Core APIs:** [See docs/medusajs-api-coverage.md]

**Custom APIs:**
- Brands: 5 endpoints
- Wishlist: 3 endpoints
- Reviews: 5 endpoints
- Sellers: 10 endpoints
- Media: 4 endpoints
- Warranty: 6 endpoints
- i18n: 4 endpoints
- Express Delivery: 3 endpoints
- Support: 8 endpoints
- Mobile: 6 endpoints

**Total: 54 custom endpoints**

### Appendix B: Database Schema

[See separate ER diagram document]

### Appendix C: Technology Documentation

- MedusaJS v2: https://docs.medusajs.com
- Next.js 14: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs
- Odoo XML-RPC: https://www.odoo.com/documentation

### Appendix D: Contact List

```
Project Manager: [PM Name] - pm@marqasouq.com
Tech Lead: [Lead Name] - lead@marqasouq.com
Frontend Lead: [FE Lead] - frontend@marqasouq.com
DevOps: [DevOps Name] - devops@marqasouq.com
```

---

## 📞 SUPPORT & QUESTIONS

For questions during development:
- **Slack:** #marqa-souq-dev
- **Email:** dev@marqasouq.com
- **Documentation:** /docs folder
- **Wiki:** [Project Wiki URL]

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Next Review:** Weekly during development  

---

**Let's build something amazing! 🚀**
