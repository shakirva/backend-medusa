# Odoo → MarqaSouq Complete Product Field Mapping

> **Document Version**: 1.0 | **Date**: March 3, 2026  
> **Purpose**: Map every Odoo `product.template` field to MedusaJS storage location  
> **Odoo is the Single Source of Truth** — all product data flows **Odoo → MedusaJS → Frontend**

---

## 📊 Current State vs Target State

### What We ALREADY Sync (✅ Built)
| Odoo Field | MedusaJS Location | Script |
|---|---|---|
| `name` | `product.title` | odoo-sync.ts, import-odoo-products.ts |
| `default_code` (SKU) | `variant.sku` + `metadata.odoo_sku` | odoo-sync.ts |
| `list_price` | `variant.prices[]` (KWD) | sync-odoo-prices.ts |
| `standard_price` (Cost) | `metadata.cost_price` | import-odoo-products.ts |
| `description_sale` | `product.description` | odoo-sync.ts |
| `categ_id` | `metadata.odoo_category_id/name` | odoo-sync.ts |
| `weight` | `product.weight` | import-odoo-products.ts |
| `qty_available` | `inventory_item.stocked_quantity` | sync-odoo-inventory.ts |
| `barcode` | `metadata.odoo_barcode` | odoo-sync.ts |
| `image_1920` | `product.images[]` (downloaded) | sync-odoo-images.ts |
| `active` | Filter on sync (only active=true) | odoo-sync.ts |
| `sale_ok` | Filter on sync (only saleable) | service.ts |
| `create_date` / `write_date` | Delta sync filter | odoo-sync-job.ts |

### What We NEED to Sync (🔴 Not Built)
**68 critical fields** across 8 categories — detailed below.

---

## 🗂️ COMPLETE FIELD MAPPING BY CATEGORY

### 1️⃣ CORE PRODUCT INFO (Priority: 🔴 Critical)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 1 | Name | `name` | `product.title` | Native | ✅ Done |
| 2 | Internal Reference (SKU) | `default_code` | `variant.sku` | Native | ✅ Done |
| 3 | Barcode | `barcode` | `variant.barcode` + `metadata.barcode` | Native+Meta | ✅ Done |
| 4 | Sales Price | `list_price` | `variant.prices[]` | Native | ✅ Done |
| 5 | Cost | `standard_price` | `metadata.cost_price` | Metadata | ✅ Done |
| 6 | Compare to Price | `compare_list_price` | `metadata.compare_price` → shows as ~~strikethrough~~ | Metadata | 🔴 TODO |
| 7 | Retail Price | `retail_price` | `metadata.retail_price` | Metadata | 🔴 TODO |
| 8 | Product Type | `type` | `metadata.odoo_product_type` (goods/service/combo) | Metadata | 🔴 TODO |
| 9 | Sales Description | `description_sale` | `product.description` | Native | ✅ Done |
| 10 | eCommerce Description | `description_ecommerce` | `metadata.ecommerce_description` (rich HTML for PDP) | Metadata | 🔴 TODO |
| 11 | Description (Internal) | `description` | `metadata.internal_description` | Metadata | ⚪ Optional |
| 12 | Purchase Description | `description_purchase` | `metadata.purchase_description` | Metadata | ⚪ Optional |
| 13 | Currency | `currency_id` | Used for price conversion | Logic | 🔴 TODO |
| 14 | Company | `company_id` | `metadata.company` | Metadata | ⚪ Optional |
| 15 | Active | `active` | Filter (don't import inactive) | Logic | ✅ Done |
| 16 | Sequence | `sequence` | `metadata.sort_order` → product listing order | Metadata | 🟡 Nice |
| 17 | Color Index | `color` | `metadata.color_index` | Metadata | ⚪ Optional |
| 18 | Favorite | `is_favorite` | `metadata.is_featured` → show in featured section | Metadata | 🟡 Nice |

### 2️⃣ BRAND & CATEGORY (Priority: 🔴 Critical)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 19 | Brand | `brand_id` | `metadata.brand_id` + `metadata.brand_name` → Brand module | Module+Meta | 🔴 TODO |
| 20 | Brand (Custom) | `x_studio_brand_1` | `metadata.brand_selection` (backup brand field) | Metadata | 🔴 TODO |
| 21 | Product Category | `categ_id` | `product.categories[]` → Map to Medusa categories | Native | 🟡 Partial |
| 22 | Sub Category (Custom) | `x_studio_sub_category` | `metadata.sub_category` → sub-category display | Metadata | 🔴 TODO |
| 23 | Website Categories | `public_categ_ids` | `product.categories[]` → website category tree | Native | 🔴 TODO |

### 3️⃣ INVENTORY & LOGISTICS (Priority: 🔴 Critical)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 24 | Quantity On Hand | `qty_available` | `inventory_item.stocked_quantity` | Native | ✅ Done |
| 25 | Forecasted Quantity | `virtual_available` | `metadata.forecasted_qty` | Metadata | 🔴 TODO |
| 26 | Incoming | `incoming_qty` | `metadata.incoming_qty` | Metadata | 🔴 TODO |
| 27 | Outgoing | `outgoing_qty` | `metadata.outgoing_qty` | Metadata | 🔴 TODO |
| 28 | Track Inventory | `is_storable` | `variant.manage_inventory` | Native | 🔴 TODO |
| 29 | Weight | `weight` | `product.weight` / `variant.weight` | Native | ✅ Done |
| 30 | Volume | `volume` | `metadata.volume` | Metadata | 🔴 TODO |
| 31 | Weight UoM | `weight_uom_name` | `metadata.weight_unit` (kg/lb) | Metadata | 🟡 Nice |
| 32 | Volume UoM | `volume_uom_name` | `metadata.volume_unit` (m³/L) | Metadata | 🟡 Nice |
| 33 | HS Code | `hs_code` | `variant.hs_code` | Native | 🔴 TODO |
| 34 | Origin of Goods | `country_of_origin` | `variant.origin_country` + `metadata.origin_country_name` | Native | 🔴 TODO |
| 35 | Customer Lead Time | `sale_delay` | `metadata.lead_time_days` → display on PDP | Metadata | 🔴 TODO |
| 36 | Continue selling OOS | `allow_out_of_stock_order` | `variant.allow_backorder` | Native | 🔴 TODO |
| 37 | Out-of-Stock Message | `out_of_stock_message` | `metadata.oos_message` → display on PDP | Metadata | 🔴 TODO |
| 38 | Show Available Qty | `show_availability` | `metadata.show_stock_qty` (boolean) | Metadata | 🔴 TODO |
| 39 | Availability Threshold | `available_threshold` | `metadata.stock_threshold` | Metadata | 🟡 Nice |
| 40 | Unit of Measure | `uom_id` | `metadata.uom` | Metadata | 🟡 Nice |

### 4️⃣ IMAGES & MEDIA (Priority: 🔴 Critical)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 41 | Main Image | `image_1920` | `product.thumbnail` + `product.images[0]` | Native | ✅ Done |
| 42 | Image 1024 | `image_1024` | Use for thumbnails/lists | Logic | 🟡 Nice |
| 43 | Extra Product Media | `product_template_image_ids` | `product.images[]` (all gallery images) | Native | 🔴 TODO |
| 44 | Can Image be Zoomed | `can_image_1024_be_zoomed` | `metadata.zoomable` → enable zoom on PDP | Metadata | ⚪ Optional |

### 5️⃣ VARIANTS & ATTRIBUTES (Priority: 🔴 Critical)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 45 | Product Attributes | `attribute_line_ids` | `product.options[]` → Color, Size, etc. | Native | 🔴 TODO |
| 46 | Product Variants | `product_variant_ids` | `product.variants[]` with individual SKU/price/stock | Native | 🔴 TODO |
| 47 | Variant Count | `product_variant_count` | Derived from variants[] length | Logic | 🔴 TODO |
| 48 | Configurable Product | `has_configurable_attributes` | `metadata.is_configurable` | Metadata | ⚪ Optional |
| 49 | Valid Attribute Lines | `valid_product_template_attribute_line_ids` | Filter visible options only | Logic | 🟡 Nice |

### 6️⃣ SEO & WEBSITE (Priority: 🟡 Important)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 50 | SEO Name (slug) | `seo_name` | `product.handle` (URL slug) | Native | 🔴 TODO |
| 51 | Website Meta Title | `website_meta_title` | `metadata.seo_title` → `<title>` tag | Metadata | 🔴 TODO |
| 52 | Website Meta Description | `website_meta_description` | `metadata.seo_description` → `<meta>` | Metadata | 🔴 TODO |
| 53 | Website Meta Keywords | `website_meta_keywords` | `metadata.seo_keywords` | Metadata | 🔴 TODO |
| 54 | Website OpenGraph Image | `website_meta_og_img` | `metadata.og_image` | Metadata | 🟡 Nice |
| 55 | Is Published | `is_published` | `product.status` (published/draft) | Native | 🔴 TODO |
| 56 | Website URL | `website_url` | Reference for link mapping | Logic | ⚪ Optional |
| 57 | Website Sequence | `website_sequence` | `metadata.display_order` | Metadata | 🟡 Nice |
| 58 | Ribbon | `website_ribbon_id` | `metadata.ribbon` → "NEW", "SALE", "HOT" badge | Metadata | 🔴 TODO |
| 59 | Is SEO Optimized | `is_seo_optimized` | `metadata.seo_optimized` | Metadata | ⚪ Optional |
| 60 | Tags | `product_tag_ids` | `product.tags[]` | Native | 🔴 TODO |

### 7️⃣ SALES & CROSS-SELL (Priority: 🟡 Important)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 61 | Optional Products | `optional_product_ids` | `metadata.upsell_product_ids` → "You may also like" | Metadata | 🔴 TODO |
| 62 | Accessory Products | `accessory_product_ids` | `metadata.accessory_product_ids` → "Frequently bought" | Metadata | 🔴 TODO |
| 63 | Alternative Products | `alternative_product_ids` | `metadata.alternative_product_ids` → "Compare with" | Metadata | 🔴 TODO |
| 64 | Sold Count | `sales_count` | `metadata.total_sold` → social proof | Metadata | 🟡 Nice |
| 65 | Combo Products | `combo_ids` | `metadata.combo_ids` → bundle display | Metadata | 🟡 Nice |
| 66 | Invoicing Policy | `invoice_policy` | `metadata.invoice_policy` | Metadata | ⚪ Optional |

### 8️⃣ RATINGS & REVIEWS (Priority: 🟡 Important)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 67 | Average Rating | `rating_avg` | `metadata.rating` → star display on PDP/cards | Metadata | 🔴 TODO |
| 68 | Rating Count | `rating_count` | `metadata.reviews_count` | Metadata | 🔴 TODO |
| 69 | Rating Satisfaction % | `rating_percentage_satisfaction` | `metadata.satisfaction_pct` | Metadata | 🟡 Nice |
| 70 | Rating Last Feedback | `rating_last_feedback` | `metadata.latest_review_text` | Metadata | 🟡 Nice |
| 71 | Rating Last Value | `rating_last_value` | `metadata.latest_review_rating` | Metadata | 🟡 Nice |

### 9️⃣ VENDOR / SUPPLIER (Priority: 🟡 Important)

| # | Odoo Field | Odoo Name | MedusaJS Target | Storage | Status |
|---|---|---|---|---|---|
| 72 | Vendors | `seller_ids` | `metadata.vendors[]` → {name, price, currency, lead_time} | Metadata | 🔴 TODO |
| 73 | Purchase Unit | `uom_po_id` | `metadata.purchase_uom` | Metadata | ⚪ Optional |
| 74 | Purchase Control | `purchase_method` | `metadata.purchase_control` | Metadata | ⚪ Optional |

### 🔟 ACCOUNTING (Priority: ⚪ Internal Only — Don't expose to frontend)

| # | Odoo Field | Odoo Name | MedusaJS Target | Status |
|---|---|---|---|---|
| 75 | Income Account | `property_account_income_id` | `metadata.income_account` | ⚪ Skip |
| 76 | Expense Account | `property_account_expense_id` | `metadata.expense_account` | ⚪ Skip |
| 77 | Sales Taxes | `taxes_id` | `metadata.tax_ids` | ⚪ Skip |
| 78 | Purchase Taxes | `supplier_taxes_id` | `metadata.purchase_tax_ids` | ⚪ Skip |
| 79 | Valuation | `valuation` | `metadata.valuation_method` | ⚪ Skip |

---

## 📈 SUMMARY: Field Coverage

| Category | Total Fields | ✅ Done | 🔴 TODO | 🟡 Nice | ⚪ Skip |
|---|---|---|---|---|---|
| Core Product Info | 18 | 6 | 7 | 2 | 3 |
| Brand & Category | 5 | 0 | 4 | 1 | 0 |
| Inventory & Logistics | 17 | 3 | 10 | 3 | 1 |
| Images & Media | 4 | 1 | 1 | 1 | 1 |
| Variants & Attributes | 5 | 0 | 3 | 1 | 1 |
| SEO & Website | 11 | 0 | 7 | 2 | 2 |
| Sales & Cross-sell | 6 | 0 | 3 | 2 | 1 |
| Ratings & Reviews | 5 | 0 | 2 | 3 | 0 |
| Vendor/Supplier | 3 | 0 | 1 | 0 | 2 |
| Accounting | 5 | 0 | 0 | 0 | 5 |
| **TOTAL** | **79** | **10** | **38** | **15** | **16** |

> **10 fields done, 38 critical fields to build, 15 nice-to-have, 16 skip (internal/accounting)**

---

## 🏗️ ARCHITECTURE: How Data Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                        ODOO ERP                                 │
│  product.template (200+ fields)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ General  │ │ Variants │ │ Inventory│ │ Sales    │          │
│  │ Info     │ │ & Attribs│ │ & Stock  │ │ & eComm  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
└───────┼─────────────┼────────────┼─────────────┼────────────────┘
        │             │            │             │
        ▼             ▼            ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SYNC LAYER (MedusaJS Backend)                      │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Full Sync Script │  │ Scheduled Jobs   │  │ Odoo Webhooks │ │
│  │ (Manual/First)   │  │ (Every 5-15 min) │  │ (Real-time)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬────────┘ │
│           │                     │                    │          │
│           ▼                     ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            MedusaJS Product Model                        │   │
│  │                                                          │   │
│  │  Native Fields:                                          │   │
│  │  • title, description, handle, status, weight            │   │
│  │  • thumbnail, images[], categories[], tags[]             │   │
│  │  • variants[] → sku, barcode, prices[], inventory        │   │
│  │  • options[] → Color, Size, etc.                         │   │
│  │                                                          │   │
│  │  Metadata (JSON):                                        │   │
│  │  • odoo_id, brand, cost_price, compare_price             │   │
│  │  • seo_title, seo_description, seo_keywords              │   │
│  │  • rating, reviews_count, total_sold                     │   │
│  │  • lead_time_days, oos_message, ribbon                   │   │
│  │  • upsell/accessory/alternative product IDs              │   │
│  │  • vendors[], forecasted_qty, volume, hs_code            │   │
│  │  • ecommerce_description (rich HTML)                     │   │
│  │  • sub_category, brand_selection                         │   │
│  │  • synced_at (last sync timestamp)                       │   │
│  └─────────────────────────────────┬────────────────────────┘   │
│                                    │                            │
│  ┌─────────────────────────────────▼────────────────────────┐   │
│  │            Store API (/store/products)                    │   │
│  │  Returns product + metadata to frontend                   │   │
│  └─────────────────────────────────┬────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS FRONTEND (markasouq-web)                   │
│                                                                 │
│  Product Detail Page:                                           │
│  • Brand logo + name (from metadata.brand)                      │
│  • Image gallery (from images[])                                │
│  • Price + Compare price (strikethrough)                        │
│  • Rating stars + review count                                  │
│  • Variant selector (Color/Size from options[])                 │
│  • Stock status ("In Stock" / "Only 3 left" / OOS message)     │
│  • Lead time ("Delivery in 2-3 days")                           │
│  • Ribbon badge ("NEW" / "SALE" / "HOT DEAL")                  │
│  • Rich description (eCommerce HTML)                            │
│  • Specifications table                                         │
│  • Cross-sell: "You may also like" / "Frequently bought"        │
│  • SEO: meta title, description, OG image                       │
│                                                                 │
│  Product Listing Page:                                          │
│  • Filter by brand, category, sub-category, price range         │
│  • Sort by: price, rating, newest, best-selling                 │
│  • Product cards with ribbon, rating, compare price              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Odoo Fields to Fetch (Updated `fetchProducts`)

```typescript
// NEW: Complete field list for Odoo sync
const ODOO_PRODUCT_FIELDS = [
  // Core
  "id", "name", "default_code", "barcode", "type", "active",
  "list_price", "standard_price", "compare_list_price", "retail_price",
  "currency_id", "sequence", "is_favorite", "color",
  
  // Descriptions
  "description", "description_sale", "description_ecommerce",
  "description_picking", "description_pickingin", "description_pickingout",
  
  // Brand & Category
  "brand_id", "categ_id", "public_categ_ids",
  "x_studio_brand_1", "x_studio_sub_category",
  
  // Inventory & Logistics
  "qty_available", "virtual_available", "incoming_qty", "outgoing_qty",
  "is_storable", "weight", "volume", "weight_uom_name", "volume_uom_name",
  "hs_code", "country_of_origin", "sale_delay",
  "allow_out_of_stock_order", "out_of_stock_message",
  "show_availability", "available_threshold",
  "uom_id", "uom_name",
  
  // Images
  "image_1920", "product_template_image_ids", "can_image_1024_be_zoomed",
  
  // Variants & Attributes
  "attribute_line_ids", "product_variant_ids", "product_variant_count",
  "has_configurable_attributes",
  
  // SEO & Website
  "seo_name", "website_meta_title", "website_meta_description",
  "website_meta_keywords", "website_meta_og_img",
  "is_published", "website_url", "website_sequence",
  "website_ribbon_id",
  "product_tag_ids",
  
  // Sales & Cross-sell
  "optional_product_ids", "accessory_product_ids", "alternative_product_ids",
  "sales_count", "combo_ids", "sale_ok", "purchase_ok",
  
  // Ratings
  "rating_avg", "rating_count", "rating_percentage_satisfaction",
  "rating_last_feedback", "rating_last_value",
  
  // Vendors
  "seller_ids",
  
  // Timestamps
  "create_date", "write_date",
]
```
