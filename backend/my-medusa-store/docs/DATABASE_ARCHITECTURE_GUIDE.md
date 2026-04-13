# MarqaSouq — Database & Module Architecture Guide (For Beginners)

## 📌 Quick Answer to Your Questions

| Question | Answer |
|----------|--------|
| Where is the table schema defined? | `src/modules/<module>/models/<name>.ts` |
| Where is the SQL migration? | `src/modules/<module>/migrations/Migration<date>.ts` |
| How to create migration? | Run `npx medusa db:generate <module>` |
| How to apply migration? | Run `npx medusa db:migrate` |
| How does another developer get your new table? | He pulls code + runs `npx medusa db:migrate` |
| Does deployment auto-migrate? | Yes, if you run `npx medusa db:migrate` in deploy script |

---

## 🧱 How MedusaJS 2.x Database Works (Step by Step)

### Two Types of Tables:

```
┌─────────────────────────────────────────────────────┐
│                    DATABASE (151 tables)             │
├─────────────────────┬───────────────────────────────┤
│  BUILT-IN TABLES    │   YOUR CUSTOM TABLES          │
│  (MedusaJS Core)    │   (Your Modules)              │
│                     │                               │
│  • product          │   • brand                     │
│  • product_variant  │   • product_brand             │
│  • product_category │   • blog_post                 │
│  • price            │   • media                     │
│  • price_set        │   • gallery_media             │
│  • order            │   • review                    │
│  • customer         │   • seller                    │
│  • cart             │   • seller_request            │
│  • image            │   • warranty                  │
│  • region           │   • warranty_claim            │
│  • fulfillment      │   • wishlist                  │
│  • payment          │   • wishlist_item             │
│  • ... (100+ more)  │   • product_qa                │
│                     │   • seller_product_link       │
│  YOU NEVER TOUCH    │                               │
│  THESE!             │   YOU CREATE THESE!           │
└─────────────────────┴───────────────────────────────┘
```

**Built-in tables** = MedusaJS manages them (product, order, cart, customer, price, etc.)
**Custom tables** = YOU create them as "modules" (brand, blog, review, seller, warranty, etc.)

---

## 📁 Module Folder Structure (The Pattern)

Every custom table follows this EXACT pattern:

```
src/modules/blog/                  ← Module folder
├── models/
│   └── post.ts                    ← 1️⃣ TABLE SCHEMA (defines columns)
├── migrations/
│   ├── Migration20260223063932.ts ← 2️⃣ SQL MIGRATION (creates table in DB)
│   └── .snapshot-blog.json        ← Auto-generated snapshot
├── service.ts                     ← 3️⃣ SERVICE (CRUD operations)
└── index.ts                       ← 4️⃣ MODULE REGISTRATION
```

### Your Project Has 8 Custom Modules:

| Module | Table(s) | What It Does |
|--------|----------|--------------|
| `blog` | `blog_post` | Blog articles |
| `brands` | `brand`, `product_brand` | Product brands (Apple, Samsung, etc.) |
| `media` | `media`, `gallery_media`, `banner` | Videos, galleries, banners |
| `reviews` | `review` | Product reviews |
| `sellers` | `seller`, `seller_request`, `seller_product_link` | Marketplace sellers |
| `warranty` | `warranty`, `warranty_claim` | Product warranties |
| `wishlist` | `wishlist`, `wishlist_item` | Customer wishlists |
| `odoo-sync` | (no table — uses jobs) | Syncs with Odoo ERP |

---

## 🔗 How Product Data is Spread Across Tables

The `product` table DOES NOT store everything. Here's where each piece lives:

```
product (main table)
├── id, title, handle, description, thumbnail, status
│
├── product_variant (sizes, colors, etc.)
│   ├── id, title, sku, barcode, product_id
│   │
│   └── product_variant_price_set ──→ price_set ──→ price
│       (LINKS variant to its price)     (price container)   (actual amount: 29.990 KWD)
│
├── image (product images)
│   ├── id, url, product_id
│
├── product_category_product (which categories)
│   ├── product_id, product_category_id
│
├── product_sales_channel (visible on which storefront)
│   ├── product_id, sales_channel_id
│
├── product_brand (which brand - YOUR custom link)
│   ├── product_id, brand_id
│
├── product_option (e.g., "Color", "Size")
│   ├── id, title, product_id
│   └── product_option_value (e.g., "Red", "Blue", "XL")
│
└── review (YOUR custom module)
    ├── product_id, rating, comment
```

### Price Chain (Most Confusing Part):

```
product
  └── product_variant (e.g., "Default Variant")
        └── product_variant_price_set (link table)
              └── price_set (container)
                    └── price (actual money amount)
                          ├── amount: 29990    ← stored in SMALLEST unit (fils)
                          ├── currency_code: "kwd"
                          └── rules: region_id ← which region this price is for
```

**So to show a product price, you need to JOIN through 4 tables!**
That's why products show KWD 0.000 — the price chain might be broken.

---

## 🛠️ Step-by-Step: How to Create a New Table

Let's say you want to add a `faq` table. Here's exactly what to do:

### Step 1: Create the Model (Schema)

Create file: `src/modules/faq/models/faq.ts`

```typescript
import { model } from "@medusajs/framework/utils"

const FAQ = model.define("faq", {
    id: model.id().primaryKey(),
    question: model.text(),
    answer: model.text(),
    category: model.text().nullable(),
    is_published: model.boolean().default(true),
    display_order: model.number().default(0),
})

export default FAQ
```

### Step 2: Create the Service

Create file: `src/modules/faq/service.ts`

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import FAQ from "./models/faq"

class FaqService extends MedusaService({ FAQ }) {}

export default FaqService
```

### Step 3: Create the Module Index

Create file: `src/modules/faq/index.ts`

```typescript
import { Module } from "@medusajs/framework/utils"
import FaqService from "./service"

export const FAQ_MODULE = "faq"

export default Module(FAQ_MODULE, {
    service: FaqService,
})
```

### Step 4: Register in medusa-config.ts

```typescript
// Add this line inside modules: { ... }
faq: { resolve: "./src/modules/faq" },
```

### Step 5: Generate Migration

```bash
npx medusa db:generate faq
```

This auto-creates: `src/modules/faq/migrations/Migration<timestamp>.ts`

### Step 6: Run Migration (Creates Table in DB)

```bash
npx medusa db:migrate
```

✅ Done! The `faq` table now exists in PostgreSQL.

---

## 🔄 How Another Developer Gets Your New Table

### You (after creating the module):
```bash
git add .
git commit -m "Add FAQ module"
git push origin main
```

### Another Developer:
```bash
git pull origin main          # Gets your code (model + migration files)
npm install                   # In case you added packages
npx medusa db:migrate         # Runs YOUR migration → creates table in HIS database
```

**That's it!** The migration file contains the exact SQL. When he runs `db:migrate`, it creates the same table in his database.

---

## 🚀 How It Works During Deployment

In your deploy script (`scripts/deploy.sh` or PM2 config):

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations (THIS creates/updates tables)
npx medusa db:migrate

# 4. Build
npx medusa build

# 5. Start server
npx medusa start
```

**Step 3 is the key** — it looks at all migration files and runs any that haven't been run yet on the production database.

MedusaJS tracks which migrations have already run in a `mikro_orm_migrations` table:

```
mikro_orm_migrations
├── id: 1, name: "Migration20251118091459"  ← already run ✅
├── id: 2, name: "Migration20251119043200"  ← already run ✅
└── id: 3, name: "Migration20260303102032"  ← NEW → will run now
```

---

## 📊 Complete Database Map (Your Project)

### Built-in MedusaJS Tables (you DON'T manage these):

| Group | Tables | Purpose |
|-------|--------|---------|
| **Product** | `product`, `product_variant`, `product_option`, `product_option_value`, `product_type`, `product_tag`, `product_tags`, `product_collection`, `product_category`, `product_category_product`, `product_shipping_profile`, `product_sales_channel` | All product data |
| **Pricing** | `price`, `price_set`, `price_list`, `price_rule`, `price_list_rule`, `price_preference`, `product_variant_price_set` | Product prices |
| **Images** | `image` | Product images (url + product_id) |
| **Orders** | `order`, `order_item`, `order_line_item`, `order_address`, `order_shipping`, `order_summary`, `order_transaction`, `order_payment_collection`, `order_fulfillment`, `order_change`, etc. | All order data |
| **Cart** | `cart`, `cart_line_item`, `cart_address`, `cart_shipping_method` | Shopping carts |
| **Customer** | `customer`, `customer_address`, `customer_group` | Customer accounts |
| **Region** | `region`, `region_country` | Geographic regions & currencies |
| **Payment** | `payment`, `payment_collection`, `payment_provider`, `payment_session` | Payments |
| **Fulfillment** | `fulfillment`, `fulfillment_item`, `fulfillment_provider` | Shipping/delivery |
| **Auth** | `auth_identity`, `provider_identity` | Login/auth |
| **Inventory** | `inventory_item`, `inventory_level`, `product_variant_inventory_item` | Stock management |
| **Sales Channel** | `sales_channel` | Storefronts (web, mobile, etc.) |

### Your Custom Module Tables:

| Table | Module | Columns |
|-------|--------|---------|
| `brand` | brands | id, name, slug, description, logo_url, banner_url, is_active, is_special, display_order |
| `product_brand` | brands | product_id, brand_id (links products to brands) |
| `blog_post` | blog | id, title, slug, content, excerpt, author, image_url, is_published, category |
| `media` | media | id, title, type, url, thumbnail_url, is_published |
| `gallery_media` | media | gallery_id, media_id |
| `banner` | media | id, title, image_url, link, position, is_active |
| `review` | reviews | id, product_id, customer_id, rating, title, content, is_approved |
| `seller` | sellers | id, name, email, company, status |
| `seller_request` | sellers | id, name, email, status |
| `seller_product_link` | sellers | seller_id, product_id |
| `warranty` | warranty | id, product_id, title, duration, terms |
| `warranty_claim` | warranty | id, warranty_id, customer_id, status |
| `wishlist` | wishlist | id, customer_id |
| `wishlist_item` | wishlist | id, wishlist_id, product_id |
| `product_qa` | (standalone) | id, product_id, question, answer |

---

## ⚡ Quick Commands Reference

```bash
# Generate migration for a module (after changing model)
npx medusa db:generate <module-name>

# Run all pending migrations
npx medusa db:migrate

# Rollback last migration
npx medusa db:rollback <module-name>

# Check DB directly
psql postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev

# Check which migrations have run
psql ... -c "SELECT * FROM mikro_orm_migrations ORDER BY id;"
```

---

## ❓ Your Specific Questions Answered

### "Where is the schema scripted in the project folder?"
→ `src/modules/<module>/models/<name>.ts` — this is where you define columns

### "How does it migrate while deploying?"
→ Run `npx medusa db:migrate` in your deploy script. It reads migration files and creates/updates tables.

### "What if another developer adds a new table?"
→ He creates the module (model + service + index), generates migration, commits & pushes. You pull and run `npx medusa db:migrate`.

### "Do we need new fields in the product table for brand/category/price?"
→ **NO!** MedusaJS already has separate tables for these:
- **Brand** → Your custom `product_brand` table (links product ↔ brand)
- **Category** → Built-in `product_category_product` table
- **Price** → Built-in `price` table (linked through variant → price_set → price)
- **Images** → Built-in `image` table (has product_id column)
- **Attributes** → Use `product_option` + `product_option_value` tables
- **Variants** → Built-in `product_variant` table

**You NEVER add columns to the `product` table directly!** You either:
1. Use existing related tables (category, price, image, option)
2. Create a custom module with a link table (like `product_brand`)
