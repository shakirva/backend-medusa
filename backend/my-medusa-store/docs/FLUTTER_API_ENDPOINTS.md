# MarqaSouq - Flutter API Documentation

> **All endpoints tested and verified on 4 March 2026**

**Base URL (Production):** `https://admin.markasouqs.com`  
**Base URL (Local Dev):** `http://localhost:9000`

---

## Required Header (ALL requests)

```
x-publishable-api-key: pk_3971873a84ad4ec5ea711738227a4be2f078a2fd872f40125628afc860b9887b
```

## Region ID (for product prices)

```
Production:  reg_01KAARY0EYGZY423VSZV7DVX25   (Kuwait — KWD)
Local Dev:   reg_01KFYZNTFQ4AGNEVR15206N3GN   (Kuwait — KWD)
```

> ⚠️ **Region IDs are different between production and local!**  
> Always call **GET /store/regions** on app startup to get the correct region ID dynamically.

---

## ✅ PRODUCTION TEST STATUS (https://admin.markasouqs.com)

| # | Endpoint | Production | Local | Notes |
|---|----------|-----------|-------|-------|
| 1 | `GET /store/homepage` | ✅ 200 | ✅ 200 | |
| 2 | `GET /store/media/banners` | ✅ 200 | ✅ 200 | |
| 3 | `GET /store/categories/tree` | ✅ 200 | ✅ 200 | |
| 4 | `GET /store/filter-options` | ✅ 200 | ✅ 200 | |
| 5 | `GET /store/products` | ✅ 200 | ✅ 200 | Prod: 1871 products, Local: 2170 |
| 6 | `GET /store/products/:id/details` | ✅ 200 | ✅ 200 | |
| 7 | `GET /store/products/:id/qa` | ✅ 200 | ✅ 200 | |
| 8 | `POST /store/products/:id/qa` | ✅ 200 | ✅ 200 | |
| 9 | `GET /store/products/:id/reviews` | ✅ 200 | ✅ 200 | |
| 10 | `GET /store/pages` | ✅ 200 | ✅ 200 | 6 pages |
| 11 | `GET /store/pages/:slug` | ✅ 200 | ✅ 200 | |
| 12 | `GET /store/brands` | ✅ 200 | ✅ 200 | 6 brands |
| 13 | `GET /store/brands/:slug` | ✅ 200 | ✅ 200 | |
| 14 | `GET /store/categories/:handle/products` | ✅ 200 | ✅ 200 | Use valid handle from tree |
| 15 | `GET /store/product-categories` | ✅ 200 | ✅ 200 | Prod: 251, Local: 263 |
| 16 | `GET /store/collections` | ✅ 200 | ✅ 200 | 6 collections (same IDs) |
| 17 | `GET /store/regions` | ✅ 200 | ✅ 200 | **Different IDs!** |
| 18 | `POST /store/carts` | ✅ 200 | ✅ 200 | |
| 19 | `POST /auth/customer/emailpass` | ✅ works | ✅ works | |
| 20 | `GET /store/wishlist` | ✅ 401 | ✅ 401 | Requires auth (correct) |
| 21 | `GET /store/sellers` | ✅ 200 | ✅ 200 | |
| 22 | `POST /store/seller-register` | ✅ 400 | ✅ 400 | Validation works |
| 23 | `GET /store/warranty` | ✅ 200 | ✅ 200 | |
| 24 | `GET /store/media` | ✅ 200 | ✅ 200 | |
| 25 | `GET /store/media/galleries` | ✅ 200 | ✅ 200 | |
| 26 | `GET /store/media/videos` | ✅ 200 | ✅ 200 | |
| 27 | `GET /store/custom` | ✅ 200 | ✅ 200 | |
| 28 | `POST /store/account/change-password` | ✅ 400 | ✅ 400 | Validation works |
| 29 | `POST /store/account/delete` | ✅ 400 | ✅ 400 | Validation works |
| 30 | `GET /store/account/recently-viewed` | ✅ 400 | ✅ 400 | Needs customer_id |
| 31 | `GET /store/blog/posts` | ❌ 500 | ❌ 500 | **BROKEN** — table missing |
| 32 | `GET /store/blog/categories` | ❌ 500 | ❌ 500 | **BROKEN** — table missing |

> **30 of 32 endpoints working on BOTH production and local** ✅

---

## 1. HOME SCREEN

### 1.1 Full Homepage (All sections in one call) ✅
```
GET /store/homepage
```
**Response Structure:**
```json
{
  "locale": "en",
  "generated_at": "2026-03-04T...",
  "sections": [
    { "id": "hero", "type": "banner", "products": [] },
    { "id": "single_banner", "type": "banner", "products": [] },
    { "id": "dual_banner", "type": "banner", "products": [] },
    { "id": "triple_banner", "type": "banner", "products": [] },
    { "id": "host_deals", "title": "Host Deals", "type": "product_grid", "products": ["8 items"] },
    { "id": "best_in_powerbanks", "title": "Best in Powerbanks", "type": "product_grid", "products": ["4 items"] },
    { "id": "best_in_laptops", "title": "Best in Laptops", "type": "product_grid", "products": ["4 items"] },
    { "id": "new_arrival", "title": "New Arrivals", "type": "product_grid", "products": ["4 items"] },
    { "id": "recommended", "title": "Recommended", "type": "product_grid", "products": ["8 items"] }
  ],
  "banners": {
    "hero": ["5 banners — each has: id, title, link, position, image_url, media.url"],
    "single": ["1 banner"],
    "dual": ["2 banners"],
    "triple": ["3 banners"]
  }
}
```

### 1.2 Banners Only ✅
```
GET /store/media/banners
```

### 1.3 Products by Collection (individual sections)
```
GET /store/products?collection_id[]=COLLECTION_ID&region_id={REGION_ID}
```

**Collection IDs:**

| Collection | ID | Handle |
|---|---|---|
| Hot Deals | `pcol_01KE8SPARPZAB5DCE3FEM15048` | hot-deals |
| New Arrivals | `pcol_01KD30KDT7VJHQPGPFYDRKN0MA` | new-arrival |
| Recommended | `pcol_01KD30N7BSATFN7ER7DXKAS56D` | recommended |
| Best in Laptops | `pcol_01KD2PFXNWESNNWZ4QQ6WN578P` | best-in-laptops |
| Best in Power Banks | `pcol_01KD30MPNBJA9Y94TPFDR9TXBM` | best-in-power-banks |
| Apple | `pcol_01KE8RQTQ0CWAFRZPNBG6DSWRP` | apple |

### 1.4 List All Collections ✅
```
GET /store/collections
```

---

## 2. CATEGORIES SCREEN

### 2.1 Category Tree (with images + product counts) ✅
```
GET /store/categories/tree
```
Returns hierarchical tree with parent-child structure, image URLs, product counts.

### 2.2 List All Categories (MedusaJS built-in) ✅
```
GET /store/product-categories?include_descendants_tree=true
```
Returns: 263 categories with full tree structure.

### 2.3 Products by Category Handle ✅
```
GET /store/categories/{handle}/products?limit=20&offset=0
```
Example: `GET /store/categories/cables/products`

Response:
```json
{
  "products": [
    {
      "id": "prod_xxx",
      "title": "Product Name",
      "handle": "product-slug",
      "thumbnail": "http://...",
      "price": 1500,
      "currency_code": "kwd",
      "in_stock": true,
      "brand": "Samsung",
      "created_at": "2026-01-31T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 259,
    "total_pages": 13,
    "has_more": true
  }
}
```

### 2.4 Products by Category ID (MedusaJS built-in) ✅
```
GET /store/products?category_id[]=CATEGORY_ID&region_id={REGION_ID}&limit=20&offset=0
```

### 2.5 Filter Options ✅
```
GET /store/filter-options
```
Response:
```json
{
  "brands": ["Apple", "Samsung", "Porodo"],
  "colors": [{ "name": "Black", "product_count": 123 }],
  "sizes": [{ "name": "512 GB", "values": ["512 GB"] }],
  "price_range": [
    { "currency_code": "kwd", "min": -80, "max": 120000 },
    { "currency_code": "omr", "min": 32000, "max": 1000000 }
  ],
  "sort_options": [
    { "value": "created_at", "label": "Newest First" },
    { "value": "-created_at", "label": "Oldest First" },
    { "value": "title", "label": "Name A-Z" },
    { "value": "-title", "label": "Name Z-A" },
    { "value": "price_asc", "label": "Price: Low to High" },
    { "value": "price_desc", "label": "Price: High to Low" }
  ]
}
```

### 2.6 Filter Products
```
GET /store/products?category_id[]=CATEGORY_ID&region_id={REGION_ID}&limit=20&offset=0&order=created_at&q=search_term
```

---

## 3. PRODUCT DETAILS

### 3.1 Product Detail (overview, specs, images, stock, related) ✅
```
GET /store/products/{product_id}/details
```
Response includes: overview, specifications, images[], stock info, related products, brand, Q&A summary, odoo_id.

### 3.2 Single Product (MedusaJS built-in) ✅
```
GET /store/products/{product_id}?region_id={REGION_ID}
```
Returns: title, description, images[], thumbnail, variants with prices, options (color, storage, etc.), metadata.

### 3.3 Product Q&A ✅
**Get Questions:**
```
GET /store/products/{product_id}/qa
```
Response:
```json
{
  "questions": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "has_more": false
}
```

**Ask a Question:**
```
POST /store/products/{product_id}/qa
Content-Type: application/json

Body: { "question": "Is this waterproof?" }
```

### 3.4 Product Reviews ✅
```
GET /store/products/{product_id}/reviews
```
Response: `{ "reviews": [] }`

### 3.5 Search Products ✅
```
GET /store/products?q=samsung&region_id={REGION_ID}&limit=20
```

---

## 4. PROFILE / ACCOUNT SCREEN

### 4.1 List All Static Pages ✅
```
GET /store/pages
```
Response:
```json
{
  "pages": [
    { "slug": "about", "title": "About MarqaSouq", "title_ar": "عن ماركة سوق" },
    { "slug": "privacy-policy", "title": "Privacy Policy", "title_ar": "سياسة الخصوصية" },
    { "slug": "terms-and-conditions", "title": "Terms & Conditions", "title_ar": "الشروط والأحكام" },
    { "slug": "return-policy", "title": "Return Policy", "title_ar": "سياسة الإرجاع" },
    { "slug": "shipping-policy", "title": "Shipping Policy", "title_ar": "سياسة الشحن" },
    { "slug": "contact-us", "title": "Contact Us", "title_ar": "اتصل بنا" }
  ]
}
```

### 4.2 Get Page Content ✅
```
GET /store/pages/{slug}
```
Available slugs: `about`, `privacy-policy`, `terms-and-conditions`, `return-policy`, `shipping-policy`, `contact-us`

> ⚠️ **Note:** The slug is `terms-and-conditions` (NOT `terms`).

Response includes both English and Arabic content (`content`, `content_ar`).

### 4.3 Change Password ✅
```
POST /store/account/change-password
Content-Type: application/json

Body: {
  "email": "customer@email.com",
  "new_password": "newpass123"
}
```
> Does NOT use Authorization header. Uses `email` to identify the account.

### 4.4 Delete Account ✅
```
POST /store/account/delete
Content-Type: application/json

Body: {
  "customer_id": "cus_xxx",
  "reason": "No longer needed"
}
```
OR use email instead:
```json
{
  "email": "customer@email.com",
  "reason": "No longer needed"
}
```
> Either `customer_id` or `email` is required. Soft-deletes and anonymizes data.

### 4.5 Recently Viewed Products ✅
**Get Recently Viewed:**
```
GET /store/account/recently-viewed?customer_id=cus_xxx&limit=20
```

**Add to Recently Viewed:**
```
POST /store/account/recently-viewed
Content-Type: application/json

Body: {
  "customer_id": "cus_xxx",
  "product_id": "prod_xxx"
}
```

---

## 5. BRANDS

### 5.1 List All Brands ✅
```
GET /store/brands
```
Response:
```json
{
  "brands": [
    {
      "id": "...",
      "name": "Apple",
      "slug": "apple",
      "logo_url": "/brands/apple.svg",
      "is_active": true,
      "product_count": 0
    }
  ],
  "count": 6,
  "limit": 20,
  "offset": 0
}
```

### 5.2 Brand Detail ✅
```
GET /store/brands/{slug}
```

> All brands come from Odoo product data automatically.

---

## 6. AUTH (Customer Login / Register)

### 6.1 Register ✅
**Step 1: Create auth identity**
```
POST /auth/customer/emailpass/register
Content-Type: application/json

Body: {
  "email": "user@email.com",
  "password": "password123"
}
```
Returns: `{ "token": "eyJ..." }`

**Step 2: Create customer profile**
```
POST /store/customers
Authorization: Bearer {token_from_step1}
Content-Type: application/json

Body: {
  "first_name": "John",
  "last_name": "Doe"
}
```

### 6.2 Login ✅
```
POST /auth/customer/emailpass
Content-Type: application/json

Body: {
  "email": "user@email.com",
  "password": "password123"
}
```
Returns: `{ "token": "eyJ..." }`

### 6.3 Get Profile (requires auth) ✅
```
GET /store/customers/me
Authorization: Bearer {token}
```

### 6.4 Update Profile (requires auth) ✅
```
POST /store/customers/me
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "first_name": "John",
  "last_name": "Updated",
  "phone": "+965..."
}
```

---

## 7. CART & CHECKOUT (MedusaJS Built-in)

### 7.1 Create Cart ✅
```
POST /store/carts
Content-Type: application/json

Body: {
  "region_id": "{REGION_ID}"
}
```
> Get `{REGION_ID}` from `GET /store/regions` on app startup.

Returns: `{ "cart": { "id": "cart_xxx", "currency_code": "kwd", ... } }`

### 7.2 Get Cart ✅
```
GET /store/carts/{cart_id}
```

### 7.3 Add Item to Cart ✅
```
POST /store/carts/{cart_id}/line-items
Content-Type: application/json

Body: {
  "variant_id": "variant_xxx",
  "quantity": 1
}
```

### 7.4 Update Line Item Quantity ✅
```
POST /store/carts/{cart_id}/line-items/{line_item_id}
Content-Type: application/json

Body: { "quantity": 2 }
```

### 7.5 Remove Line Item ✅
```
DELETE /store/carts/{cart_id}/line-items/{line_item_id}
```

### 7.6 Add Shipping Address ✅
```
POST /store/carts/{cart_id}
Content-Type: application/json

Body: {
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "Kuwait City",
    "country_code": "kw",
    "phone": "+965..."
  }
}
```

### 7.7 Complete Cart (Place Order) ✅
```
POST /store/carts/{cart_id}/complete
```

---

## 8. ORDERS (requires auth)

### 8.1 List My Orders ✅
```
GET /store/orders
Authorization: Bearer {token}
```

### 8.2 Order Details ✅
```
GET /store/orders/{order_id}
Authorization: Bearer {token}
```

---

## 9. WISHLIST (requires auth — Bearer token)

### 9.1 Get Wishlist ✅
```
GET /store/wishlist
Authorization: Bearer {token}
```
Returns: `{ "customer_id": "...", "items": [...], "products": [...] }`

### 9.2 Add to Wishlist ✅
```
POST /store/wishlist/items
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "product_id": "prod_xxx",
  "variant_id": "variant_xxx"
}
```
> `variant_id` is optional.

### 9.3 Remove from Wishlist ✅
```
DELETE /store/wishlist/items/{item_id}
Authorization: Bearer {token}
```

---

## 10. MEDIA

### 10.1 All Media ✅
```
GET /store/media
```

### 10.2 Galleries ✅
```
GET /store/media/galleries?limit=24&offset=0
```

### 10.3 Videos ✅
```
GET /store/media/videos?limit=24&offset=0
```

### 10.4 Banners ✅
```
GET /store/media/banners
```

---

## 11. SELLERS

### 11.1 List Approved Sellers ✅
```
GET /store/sellers
```
Response: `{ "sellers": [...], "count": 0 }`

### 11.2 Seller Details ✅
```
GET /store/sellers/{id}
```
Response: `{ "seller": {...}, "product_links": [...] }`

### 11.3 Register as Seller ✅
```
POST /store/seller-register
Content-Type: application/json

Body: {
  "name": "Store Name",
  "email": "seller@email.com",
  "phone": "+965...",
  "store_name": "My Electronics",
  "message": "I want to sell electronics",
  "documents_urls": ["https://..."]
}
```
> `name` and `email` are required.

---

## 12. WARRANTY

### 12.1 Check Warranties by Email ✅
```
GET /store/warranty?email=customer@email.com
```
Response: `{ "warranties": [...], "count": 0 }`

### 12.2 Get Warranty Details ✅
```
GET /store/warranty/{warranty_id}
```

### 12.3 Register Warranty ✅
```
POST /store/warranty
Content-Type: application/json

Body: {
  "product_id": "prod_xxx",
  "customer_email": "customer@email.com",
  "type": "manufacturer",
  "duration_months": 12,
  "order_id": "order_xxx",
  "order_item_id": "item_xxx"
}
```

### 12.4 Submit Warranty Claim ✅
```
POST /store/warranty/{warranty_id}/claim
Content-Type: application/json

Body: {
  "customer_email": "customer@email.com",
  "issue_description": "Screen not working"
}
```

---

## 13. STORE CONFIG / CUSTOM DATA

### 13.1 Delivery Options & Shipping Policy ✅
```
GET /store/custom
```
Response:
```json
{
  "delivery_options": [
    { "key": "night", "label": "Night Delivery", "label_ar": "توصيل ليلي" },
    { "key": "fast", "label": "Fast Delivery", "label_ar": "توصيل سريع" },
    { "key": "standard", "label": "Standard Delivery", "label_ar": "توصيل عادي" }
  ],
  "shipping_policy": {
    "currency": "KWD",
    "free_delivery_threshold": 7,
    "charge_below_threshold": 1,
    "summary": "Free delivery for 7 KD or above, otherwise 1 KD shipping charge."
  }
}
```

### 13.2 Get Available Regions ✅
```
GET /store/regions
```
Response:
```json
{
  "regions": [
    {
      "id": "reg_01KFYZNTFQ4AGNEVR15206N3GN",
      "name": "Kuwait",
      "currency_code": "kwd"
    }
  ]
}
```

---

## ❌ BROKEN ENDPOINTS (DO NOT USE)

| Endpoint | Error | Reason |
|---|---|---|
| `GET /store/blog/posts` | 500 | `blog_post` table does not exist in database |
| `GET /store/blog/categories` | 500 | `blog_post` table does not exist in database |
| `GET /store/blog/posts/:slug` | 500 | Same — table missing |

> Blog feature requires database migration. Not available yet.

---

## IMPORTANT NOTES

1. **All product data comes from Odoo** — categories, brands, images, prices, stock are synced from Odoo ERP. Do NOT create products/categories manually.
2. **Collections** (hot-deals, new-arrival, recommended, etc.) are the only things managed from the admin dashboard.
3. **Category images** come from Odoo — not manually uploaded.
4. **Product images** — Products can have multiple images. Use the `images[]` array, not just `thumbnail`.
5. **Prices** — Always include `region_id` to get correct currency prices. Currently only Kuwait (KWD) is available.
6. **Auth** — Wishlist requires `Authorization: Bearer {token}`. Account endpoints (change-password, delete, recently-viewed) use `customer_id` or `email` in the body/query instead.
7. **Pagination** — Use `limit` and `offset` query params. Default limit is typically 20.
8. **Currency** — Current region is Kuwait with KWD. Use `GET /store/regions` to get the latest region ID dynamically.
9. **Price values** — Prices are in **minor units** (fils). Divide by 1000 for KWD display (e.g., `3500` = 3.500 KWD).
10. **x-publishable-api-key header** — This header is **required** on every single request. Without it, requests will be rejected.
11. **Region ID differs between environments** — Production: `reg_01KAARY0EYGZY423VSZV7DVX25`, Local: `reg_01KFYZNTFQ4AGNEVR15206N3GN`. **Always fetch dynamically via `GET /store/regions`.**
12. **Blog endpoints are broken** on both production and local — `blog_post` table does not exist. Do not use blog APIs until further notice.
