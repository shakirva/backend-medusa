#  Markasouq – Complete Flutter API 

> **Base URL (Production):** `https://admin.markasouqs.com`
> **Base URL (Dev):** `http://localhost:9000`
>
> **Required Header for ALL /store/ requests:**
> ```
> x-publishable-api-key: <your_publishable_key>
> Content-Type: application/json
> ```
>
> **Auth Header (for protected endpoints):**
> ```
> Authorization: Bearer <customer_jwt_token>
> ```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Homepage](#2-homepage)
3. [Products](#3-products)
4. [Categories](#4-categories)
5. [Brands](#5-brands)
6. [Cart & Checkout (Built-in Medusa)](#6-cart--checkout-built-in-medusa)
7. [Cart Session (Custom)](#7-cart-session-custom)
8. [Night Delivery Check](#8-night-delivery-check)
9. [Shipping](#9-shipping)
10. [Orders (Built-in Medusa)](#10-orders-built-in-medusa)
11. [Wishlist](#11-wishlist)
12. [Product Reviews](#12-product-reviews)
13. [Product Q&A](#13-product-qa)
14. [Warranty](#14-warranty)
15. [Account](#15-account)
16. [Blog](#16-blog)
17. [Sellers](#17-sellers)
18. [Media / Banners / Videos](#18-media--banners--videos)
19. [Filter Options](#19-filter-options)
20. [Static Pages](#20-static-pages)
21. [Publishable Key](#21-publishable-key)
22. [Custom / Delivery Options](#22-custom--delivery-options)

---

## 1. Authentication

Medusa v2 uses a **two-step** auth flow: first get a token, then use it.

### 1.1 Register Customer

```
POST /auth/customer/emailpass/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Then **create the customer profile:**

```
POST /store/customers
```

**Headers:**
```
Authorization: Bearer <token_from_above>
x-publishable-api-key: <key>
```

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "phone": "+96512345678"
}
```

**Response 200:**
```json
{
  "customer": {
    "id": "cus_01ABC...",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone": "+96512345678",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 1.2 Login

```
POST /auth/customer/emailpass
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

> 💡 **Save this token.** Use it as `Authorization: Bearer <token>` for all authenticated endpoints.

---

### 1.3 Get Logged-in Customer Profile

```
GET /store/customers/me
```

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "customer": {
    "id": "cus_01ABC...",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone": "+96512345678",
    "metadata": {},
    "shipping_addresses": [...],
    "billing_address": {...}
  }
}
```

---

### 1.4 Update Customer Profile

```
POST /store/customers/me
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+96599999999",
  "metadata": {
    "preferred_language": "ar"
  }
}
```

---

### 1.5 Reset Password Request

```
POST /auth/customer/emailpass
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

> Returns a reset token or triggers a reset email flow depending on configuration.

---

### 1.6 Change Password (Custom)

```
POST /store/account/change-password
```

**Body:**
```json
{
  "email": "user@example.com",
  "current_password": "OldPass123",
  "new_password": "NewPass456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password change request received...",
  "reset_password_endpoint": "/auth/customer/emailpass",
  "instructions": "Send POST to /auth/customer/emailpass with { email } to receive a reset token..."
}
```

---

### 1.7 Delete Account (Custom)

```
POST /store/account/delete
```

**Body:**
```json
{
  "customer_id": "cus_01ABC...",
  "email": "user@example.com",
  "reason": "No longer needed"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Account has been deleted successfully",
  "deleted_customer_id": "cus_01ABC..."
}
```

---

## 2. Homepage

### 2.1 Get Homepage Data

```
GET /store/homepage
```

**Query Params:** `?locale=en` (optional)

**Response 200:**
```json
{
  "locale": "en",
  "generated_at": "2026-04-09T12:00:00.000Z",
  "sections": [
    {
      "id": "hero",
      "type": "banner",
      "items": [
        {
          "id": "ban_01...",
          "title": "Summer Sale",
          "link": "/en/categories/electronics",
          "position": "hero",
          "image_url": "https://admin.markasouqs.com/uploads/banner1.jpg",
          "media": { "url": "https://admin.markasouqs.com/uploads/banner1.jpg" }
        }
      ]
    },
    {
      "id": "single_banner",
      "type": "banner",
      "position": "single",
      "items": [...]
    },
    {
      "id": "dual_banner",
      "type": "banner",
      "position": "dual",
      "items": [...]
    },
    {
      "id": "triple_banner",
      "type": "banner",
      "position": "triple",
      "items": [...]
    },
    {
      "id": "host_deals",
      "type": "product_grid",
      "title": "Host Deals",
      "products": [
        {
          "id": "prod_01...",
          "title": "Baseus 20000mAh Power Bank",
          "handle": "baseus-20000mah-power-bank",
          "subtitle": "Fast charging...",
          "thumbnail": "https://admin.markasouqs.com/uploads/img.jpg",
          "metadata": {
            "odoo_brand": "Baseus",
            "stock_qty": 45,
            "original_price": "5.500",
            "sale_price": "3.990"
          },
          "images": [
            { "id": "img_01...", "url": "https://...", "rank": 0 }
          ],
          "variants": [
            {
              "id": "var_01...",
              "title": "Default",
              "sku": "BS-PB-20K",
              "prices": [
                { "amount": 3990, "currency_code": "kwd" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "best_in_powerbanks",
      "type": "product_grid",
      "title": "Best in Powerbanks",
      "products": [...]
    },
    {
      "id": "best_in_laptops",
      "type": "product_grid",
      "title": "Best in Laptops",
      "products": [...]
    },
    {
      "id": "new_arrival",
      "type": "product_grid",
      "title": "New Arrivals",
      "products": [...]
    },
    {
      "id": "recommended",
      "type": "product_grid",
      "title": "Recommended",
      "products": [...]
    },
    {
      "id": "apple",
      "type": "product_grid",
      "title": "Apple",
      "products": [...]
    }
  ],
  "banners": {
    "hero": [...],
    "single": [...],
    "dual": [...],
    "triple": [...]
  }
}
```

> **💡 Price Note:** All prices are in **minor units** (fils/cents). Divide by 1000 for KWD display. e.g. `3990` → `3.990 KWD`.

---

## 3. Products

### 3.1 List Products (Built-in Medusa)

```
GET /store/products
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Products per page |
| `offset` | number | 0 | Pagination offset |
| `q` | string | — | Search query |
| `category_id` | string | — | Filter by category ID |
| `collection_id` | string | — | Filter by collection |
| `order` | string | — | Sort: `created_at`, `-created_at`, `title` |
| `fields` | string | — | Comma-separated fields to include |

**Response 200:**
```json
{
  "products": [
    {
      "id": "prod_01ABC...",
      "title": "iPhone 15 Pro",
      "handle": "iphone-15-pro",
      "subtitle": "...",
      "description": "...",
      "thumbnail": "https://...",
      "status": "published",
      "metadata": {
        "odoo_brand": "Apple",
        "stock_qty": 10,
        "original_price": "350.000",
        "sale_price": "320.000"
      },
      "variants": [...],
      "images": [...],
      "options": [...]
    }
  ],
  "count": 150,
  "offset": 0,
  "limit": 20
}
```

---

### 3.2 Get Product Details (Custom – Comprehensive)

```
GET /store/products/:id/details
```

**Query Params:** `?currency=kwd` (default: `aed`)

**Response 200:**
```json
{
  "product": {
    "id": "prod_01ABC...",
    "title": "iPhone 15 Pro",
    "handle": "iphone-15-pro",
    "subtitle": "Latest Apple flagship",
    "description": "<p>Full HTML description...</p>",
    "thumbnail": "https://...",
    "weight": 200,
    "material": null,
    "origin_country": "US",
    "metadata": {
      "odoo_brand": "Apple",
      "stock_qty": 10,
      "original_price": "350.000",
      "sale_price": "320.000",
      "night_delivery": true,
      "specifications": {
        "Display": "6.1 inch OLED",
        "Storage": "256GB",
        "RAM": "8GB"
      }
    }
  },
  "images": [
    { "id": "img_01...", "url": "https://...", "rank": 0 },
    { "id": "img_02...", "url": "https://...", "rank": 1 }
  ],
  "variants": [
    {
      "id": "var_01...",
      "title": "256GB - Natural Titanium",
      "sku": "IP15P-256-NT",
      "barcode": null,
      "price": 320000,
      "currency_code": "kwd",
      "variant_metadata": {}
    }
  ],
  "options": [
    {
      "id": "opt_01...",
      "name": "Storage",
      "values": [
        { "id": "optval_01...", "value": "256GB" },
        { "id": "optval_02...", "value": "512GB" }
      ]
    },
    {
      "id": "opt_02...",
      "name": "Color",
      "values": [
        { "id": "optval_03...", "value": "Natural Titanium" },
        { "id": "optval_04...", "value": "Blue Titanium" }
      ]
    }
  ],
  "categories": [
    { "id": "pcat_01...", "name": "Smartphones", "handle": "smartphones" }
  ],
  "reviews_summary": {
    "average_rating": 4.5,
    "total_reviews": 23,
    "ratings_breakdown": {
      "5": 15,
      "4": 5,
      "3": 2,
      "2": 1,
      "1": 0
    }
  },
  "related_products": [
    {
      "id": "prod_02...",
      "title": "iPhone 15",
      "handle": "iphone-15",
      "thumbnail": "https://...",
      "price": 280000,
      "currency_code": "kwd"
    }
  ]
}
```

---

### 3.3 Get Products by Category Handle (Custom)

```
GET /store/categories/:handle/products
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Max 50 |
| `sort` | string | `newest` | `price_asc`, `price_desc`, `newest`, `oldest`, `title_asc`, `title_desc` |
| `min_price` | number | — | Minimum price filter |
| `max_price` | number | — | Maximum price filter |
| `brand` | string | — | Filter by brand name |
| `color` | string | — | Filter by color option value |
| `in_stock` | boolean | — | `true` = only in-stock products |
| `currency` | string | `aed` | Currency code |

**Response 200:**
```json
{
  "category": {
    "id": "pcat_01...",
    "name": "Smartphones",
    "handle": "smartphones",
    "image_url": "https://..."
  },
  "products": [
    {
      "id": "prod_01...",
      "title": "iPhone 15 Pro",
      "handle": "iphone-15-pro",
      "thumbnail": "https://...",
      "price": 320000,
      "currency_code": "kwd",
      "metadata": {...},
      "images": [...],
      "variants": [...]
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

---

## 4. Categories

### 4.1 Get Category Tree (Custom)

```
GET /store/categories/tree
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `parent_id` | string | — | Filter by parent category |
| `include_empty` | boolean | `false` | Include categories with 0 products |

**Response 200:**
```json
{
  "categories": [
    {
      "id": "pcat_01...",
      "name": "Electronics",
      "handle": "electronics",
      "description": "",
      "image_url": "https://...",
      "product_count": 120,
      "parent_id": null,
      "children": [
        {
          "id": "pcat_02...",
          "name": "Smartphones",
          "handle": "smartphones",
          "image_url": "https://...",
          "product_count": 45,
          "parent_id": "pcat_01...",
          "children": []
        },
        {
          "id": "pcat_03...",
          "name": "Laptops",
          "handle": "laptops",
          "image_url": null,
          "product_count": 30,
          "parent_id": "pcat_01...",
          "children": []
        }
      ]
    }
  ],
  "total": 5
}
```

---

### 4.2 List Categories (Built-in Medusa)

```
GET /store/product-categories
```

**Query Params:** `?limit=100&offset=0&parent_category_id=null`

**Response 200:**
```json
{
  "product_categories": [
    {
      "id": "pcat_01...",
      "name": "Electronics",
      "handle": "electronics",
      "is_active": true,
      "parent_category_id": null,
      "metadata": {
        "image_url": "https://..."
      },
      "category_children": [...]
    }
  ],
  "count": 10,
  "offset": 0,
  "limit": 100
}
```

---

## 5. Brands

### 5.1 List All Brands (Custom)

```
GET /store/brands
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max results |
| `offset` | number | 0 | Pagination offset |
| `special` | boolean | — | `true` = only brands marked as special |

**Response 200:**
```json
{
  "brands": [
    {
      "id": "brand_01...",
      "name": "Apple",
      "slug": "apple",
      "logo_url": "https://...",
      "description": "...",
      "is_active": true,
      "is_special": true,
      "display_order": 1,
      "product_count": 25
    }
  ],
  "count": 15,
  "limit": 20,
  "offset": 0
}
```

---

### 5.2 Get Brand by Slug (Custom)

```
GET /store/brands/:slug
```

**Response 200:**
```json
{
  "brand": {
    "id": "brand_01...",
    "name": "Apple",
    "slug": "apple",
    "logo_url": "https://...",
    "description": "...",
    "is_active": true
  },
  "products": [
    {
      "id": "prod_01...",
      "title": "iPhone 15 Pro",
      "handle": "iphone-15-pro",
      "thumbnail": "https://..."
    }
  ]
}
```

---

## 6. Cart & Checkout (Built-in Medusa)

### 6.1 Create Cart

```
POST /store/carts
```

**Body:**
```json
{
  "region_id": "reg_01...",
  "items": [
    {
      "variant_id": "var_01...",
      "quantity": 1
    }
  ]
}
```

**Response 200:**
```json
{
  "cart": {
    "id": "cart_01ABC...",
    "region_id": "reg_01...",
    "items": [...],
    "total": 3990,
    "subtotal": 3990,
    "shipping_total": 0,
    "tax_total": 0,
    "currency_code": "kwd"
  }
}
```

---

### 6.2 Get Cart

```
GET /store/carts/:id
```

**Response 200:**
```json
{
  "cart": {
    "id": "cart_01ABC...",
    "items": [
      {
        "id": "item_01...",
        "variant_id": "var_01...",
        "title": "iPhone 15 Pro",
        "quantity": 1,
        "unit_price": 320000,
        "subtotal": 320000,
        "thumbnail": "https://..."
      }
    ],
    "total": 320000,
    "subtotal": 320000,
    "shipping_total": 0,
    "currency_code": "kwd",
    "region": {...},
    "shipping_address": {...},
    "billing_address": {...},
    "shipping_methods": [...]
  }
}
```

---

### 6.3 Add Item to Cart

```
POST /store/carts/:id/line-items
```

**Body:**
```json
{
  "variant_id": "var_01...",
  "quantity": 1
}
```

---

### 6.4 Update Cart Item Quantity

```
POST /store/carts/:id/line-items/:line_id
```

**Body:**
```json
{
  "quantity": 3
}
```

---

### 6.5 Remove Item from Cart

```
DELETE /store/carts/:id/line-items/:line_id
```

---

### 6.6 Update Cart (add shipping / billing address)

```
POST /store/carts/:id
```

**Body:**
```json
{
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "Block 5, Street 10, House 3",
    "city": "Kuwait City",
    "country_code": "kw",
    "province": "Al-Asimah",
    "phone": "+96512345678",
    "postal_code": "12345"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "Block 5, Street 10, House 3",
    "city": "Kuwait City",
    "country_code": "kw",
    "phone": "+96512345678"
  },
  "email": "user@example.com"
}
```

---

### 6.7 Add Shipping Method

```
POST /store/carts/:id/shipping-methods
```

**Body:**
```json
{
  "option_id": "so_01..."
}
```

---

### 6.8 List Shipping Options for Cart

```
GET /store/shipping-options?cart_id=cart_01...
```

**Response 200:**
```json
{
  "shipping_options": [
    {
      "id": "so_01...",
      "name": "Normal Delivery",
      "amount": 1000,
      "is_tax_inclusive": true
    }
  ]
}
```

---

### 6.9 Create Payment Sessions

```
POST /store/carts/:id/payment-sessions
```

**Body:** (empty or `{}`)

**Response 200:**
```json
{
  "cart": {
    "payment_sessions": [
      {
        "id": "ps_01...",
        "provider_id": "manual",
        "status": "pending"
      }
    ]
  }
}
```

---

### 6.10 Select Payment Session

```
POST /store/carts/:id/payment-session
```

**Body:**
```json
{
  "provider_id": "manual"
}
```

---

### 6.11 Complete Cart (Place Order)

```
POST /store/carts/:id/complete
```

**Body:** (empty or `{}`)

**Response 200:**
```json
{
  "type": "order",
  "data": {
    "id": "order_01...",
    "display_id": 1001,
    "status": "pending",
    "items": [...],
    "total": 320000,
    "currency_code": "kwd",
    "shipping_address": {...},
    "created_at": "2026-04-09T12:00:00.000Z"
  }
}
```

---

### 6.12 Apply Discount Code

```
POST /store/carts/:id
```

**Body:**
```json
{
  "discounts": [
    { "code": "SUMMER20" }
  ]
}
```

---

## 7. Cart Session (Custom)

Persist the customer's cart_id server-side so it syncs across devices.

### 7.1 Get Saved Cart ID

```
GET /store/cart/session
```

**Headers:** `Authorization: Bearer <token>` (🔒 Authenticated)

**Response 200:**
```json
{
  "cart_id": "cart_01ABC..."
}
```

---

### 7.2 Save Cart ID

```
POST /store/cart/session
```

**Headers:** `Authorization: Bearer <token>` (🔒 Authenticated)

**Body:**
```json
{
  "cart_id": "cart_01ABC..."
}
```

**Response 200:**
```json
{
  "success": true,
  "cart_id": "cart_01ABC..."
}
```

> 💡 Call this after creating a cart or after login to restore the cart across devices.

---

## 8. Night Delivery Check

### 8.1 Check Night Delivery Availability

```
GET /store/cart/:id/night-delivery
```

**Response 200:**
```json
{
  "night_delivery_allowed": true,
  "product_count": 3,
  "enabled_count": 3,
  "disabled_count": 0
}
```

> Returns `true` only if **ALL** products in the cart have `metadata.night_delivery = true`.

---

## 9. Shipping

### 9.1 Get Shipping Options (Custom)

```
GET /store/shipping
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `cartId` | string | Cart ID |
| `productId` | string | Product ID (night delivery check) |
| `areaCode` | string | Area code (fast delivery check) |

**Response 200:**
```json
{
  "shipping_options": [...],
  "message": "Found 3 available shipping methods"
}
```

---

### 9.2 Validate Shipping Method (Custom)

```
POST /store/shipping
```

**Body:**
```json
{
  "method": "night",
  "productId": "prod_01...",
  "areaCode": "AL-ASIMAH"
}
```

**Response 200:**
```json
{
  "method": "night",
  "valid": true,
  "message": "Shipping method 'night' is available"
}
```

---

## 10. Orders (Built-in Medusa)

### 10.1 List Customer Orders

```
GET /store/orders
```

**Headers:** `Authorization: Bearer <token>` (🔒 Authenticated)

**Query Params:** `?limit=10&offset=0`

**Response 200:**
```json
{
  "orders": [
    {
      "id": "order_01...",
      "display_id": 1001,
      "status": "pending",
      "fulfillment_status": "not_fulfilled",
      "payment_status": "awaiting",
      "total": 320000,
      "currency_code": "kwd",
      "items": [
        {
          "id": "item_01...",
          "title": "iPhone 15 Pro",
          "quantity": 1,
          "unit_price": 320000,
          "thumbnail": "https://..."
        }
      ],
      "shipping_address": {...},
      "created_at": "2026-04-09T12:00:00.000Z"
    }
  ],
  "count": 5,
  "offset": 0,
  "limit": 10
}
```

---

### 10.2 Get Order by ID

```
GET /store/orders/:id
```

**Headers:** `Authorization: Bearer <token>` (🔒 Authenticated)

---

## 11. Wishlist

> 🔒 **All wishlist endpoints require authentication.**

### 11.1 Get Wishlist

```
GET /store/wishlist
```

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "customer_id": "cus_01...",
  "items": [
    {
      "id": "witem_01...",
      "product_id": "prod_01...",
      "variant_id": null,
      "created_at": "2026-04-01T00:00:00Z"
    }
  ],
  "products": [
    {
      "id": "prod_01...",
      "title": "iPhone 15 Pro",
      "handle": "iphone-15-pro",
      "thumbnail": "https://..."
    }
  ]
}
```

---

### 11.2 Add to Wishlist

```
POST /store/wishlist/items
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "product_id": "prod_01...",
  "variant_id": "var_01..."
}
```

> `variant_id` is optional.

**Response 200:**
```json
{
  "item": {
    "id": "witem_01...",
    "product_id": "prod_01...",
    "variant_id": "var_01..."
  }
}
```

---

### 11.3 Remove from Wishlist

```
DELETE /store/wishlist/items/:id
```

**Headers:** `Authorization: Bearer <token>`

> `:id` is the `witem_01...` item ID.

**Response 200:**
```json
{
  "id": "witem_01...",
  "deleted": true
}
```

---

### 11.4 Check if Product is Wishlisted

```
GET /store/wishlist/check?product_id=prod_01...
```

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "is_wishlisted": true,
  "item_id": "witem_01..."
}
```

> ⚡ Use this on the Product Detail page to show/hide the heart icon. It's O(1) — does NOT fetch the entire wishlist.

---

## 12. Product Reviews

### 12.1 List Reviews for a Product

```
GET /store/products/:id/reviews
```

> 🔓 Public — no auth required.

**Response 200:**
```json
{
  "reviews": [
    {
      "id": "rev_01...",
      "product_id": "prod_01...",
      "customer_id": "cus_01...",
      "rating": 5,
      "title": "Amazing product!",
      "content": "Best phone I've ever used.",
      "status": "approved",
      "created_at": "2026-03-15T00:00:00Z"
    }
  ]
}
```

---

### 12.2 Submit a Review

```
POST /store/products/:id/reviews
```

**Body:**
```json
{
  "rating": 5,
  "title": "Great product!",
  "content": "Really happy with my purchase.",
  "customer_id": "cus_01...",
  "customer_name": "John Doe"
}
```

> `customer_id` and `customer_name` are optional. `rating` is **required** (1-5).

**Response 200:**
```json
{
  "success": true,
  "review": {
    "id": "rev_01...",
    "rating": 5,
    "title": "Great product!",
    "content": "Really happy with my purchase.",
    "status": "pending"
  }
}
```

---

## 13. Product Q&A

### 13.1 List Q&A for a Product

```
GET /store/products/:id/qa
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Results per page |

**Response 200:**
```json
{
  "questions": [
    {
      "id": "qa_1712001234_abc123",
      "question": "Does this support wireless charging?",
      "answer": "Yes, it supports MagSafe and Qi wireless charging.",
      "customer_name": "John",
      "answered_by": "Admin",
      "answered_at": "2026-04-02T00:00:00Z",
      "created_at": "2026-04-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "has_more": false
}
```

---

### 13.2 Ask a Question

```
POST /store/products/:id/qa
```

**Body:**
```json
{
  "customer_id": "cus_01...",
  "customer_name": "John Doe",
  "question": "Does this come with a charger?"
}
```

> `customer_id` is optional. `question` is **required**.

**Response 201:**
```json
{
  "success": true,
  "message": "Question submitted successfully. It will be visible once approved.",
  "question_id": "qa_1712001234_abc123"
}
```

---

## 14. Warranty

### 14.1 List Customer Warranties

```
GET /store/warranty?email=user@example.com
```

**Response 200:**
```json
{
  "warranties": [
    {
      "id": "wrty_01...",
      "product_id": "prod_01...",
      "customer_email": "user@example.com",
      "type": "manufacturer",
      "duration_months": 12,
      "order_id": "order_01...",
      "status": "active",
      "start_date": "2026-01-01",
      "end_date": "2027-01-01",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 14.2 Get Warranty by ID

```
GET /store/warranty/:id
```

**Response 200:**
```json
{
  "warranty": {
    "id": "wrty_01...",
    "product_id": "prod_01...",
    "customer_email": "user@example.com",
    "type": "manufacturer",
    "duration_months": 12,
    "status": "active"
  }
}
```

---

### 14.3 Register Warranty

```
POST /store/warranty
```

**Body:**
```json
{
  "product_id": "prod_01...",
  "customer_email": "user@example.com",
  "type": "manufacturer",
  "duration_months": 12,
  "order_id": "order_01...",
  "order_item_id": "item_01..."
}
```

> `type` = `manufacturer` | `extended`. `order_id` and `order_item_id` are optional.

**Response 201:**
```json
{
  "warranty": {
    "id": "wrty_01...",
    "product_id": "prod_01...",
    "customer_email": "user@example.com",
    "type": "manufacturer",
    "duration_months": 12,
    "status": "active"
  }
}
```

---

### 14.4 Submit Warranty Claim

```
POST /store/warranty/:id/claim
```

**Body:**
```json
{
  "customer_email": "user@example.com",
  "issue_description": "Screen is flickering after 3 months of use."
}
```

**Response 201:**
```json
{
  "claim": {
    "id": "claim_01...",
    "warranty_id": "wrty_01...",
    "customer_email": "user@example.com",
    "issue_description": "Screen is flickering...",
    "status": "pending",
    "created_at": "2026-04-09T00:00:00Z"
  }
}
```

---

## 15. Account

### 15.1 Recently Viewed – Get

```
GET /store/account/recently-viewed?customer_id=cus_01...&limit=20
```

**Response 200:**
```json
{
  "products": [
    {
      "id": "prod_01...",
      "title": "iPhone 15 Pro",
      "handle": "iphone-15-pro",
      "thumbnail": "https://...",
      "price": 320000,
      "currency_code": "kwd"
    }
  ],
  "count": 5
}
```

---

### 15.2 Recently Viewed – Add

```
POST /store/account/recently-viewed
```

**Body:**
```json
{
  "customer_id": "cus_01...",
  "product_id": "prod_01..."
}
```

**Response 200:**
```json
{
  "success": true,
  "recently_viewed_count": 6
}
```

---

### 15.3 Customer Addresses (Built-in Medusa)

**List:**
```
GET /store/customers/me/addresses
```

**Add:**
```
POST /store/customers/me/addresses
```

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "address_1": "Block 5, Street 10, House 3",
  "city": "Kuwait City",
  "country_code": "kw",
  "province": "Al-Asimah",
  "phone": "+96512345678",
  "postal_code": "12345",
  "metadata": {
    "area": "Salmiya",
    "block": "5",
    "street": "10",
    "building": "3"
  }
}
```

**Update:**
```
POST /store/customers/me/addresses/:address_id
```

**Delete:**
```
DELETE /store/customers/me/addresses/:address_id
```

---

## 16. Blog

### 16.1 List Blog Posts

```
GET /store/blog/posts
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max results |
| `offset` | number | 0 | Pagination offset |
| `category` | string | — | Filter by blog category |
| `is_featured` | boolean | — | `true` = featured posts only |

**Response 200:**
```json
{
  "posts": [
    {
      "id": "post_01...",
      "title": "Top 10 Gadgets of 2026",
      "slug": "top-10-gadgets-2026",
      "excerpt": "...",
      "content": "<p>Full HTML content...</p>",
      "category": "Technology",
      "is_featured": true,
      "is_published": true,
      "featured_image": "https://...",
      "published_at": "2026-04-01T00:00:00Z"
    }
  ],
  "count": 15,
  "limit": 20,
  "offset": 0
}
```

---

### 16.2 Get Blog Post by Slug

```
GET /store/blog/posts/:slug
```

**Response 200:**
```json
{
  "post": {
    "id": "post_01...",
    "title": "Top 10 Gadgets of 2026",
    "slug": "top-10-gadgets-2026",
    "content": "<p>Full content...</p>",
    "category": "Technology",
    "published_at": "2026-04-01T00:00:00Z"
  }
}
```

---

### 16.3 List Blog Categories

```
GET /store/blog/categories
```

**Response 200:**
```json
{
  "categories": ["Technology", "Lifestyle", "Deals", "Reviews"]
}
```

---

## 17. Sellers

### 17.1 List Approved Sellers

```
GET /store/sellers
```

**Response 200:**
```json
{
  "sellers": [
    {
      "id": "seller_01...",
      "seller_name": "TechStore Kuwait",
      "email": "info@techstore.kw",
      "status": "approved"
    }
  ],
  "count": 5
}
```

---

### 17.2 Get Seller by ID

```
GET /store/sellers/:id
```

**Response 200:**
```json
{
  "seller": {
    "id": "seller_01...",
    "seller_name": "TechStore Kuwait",
    "email": "info@techstore.kw",
    "status": "approved"
  },
  "product_links": [...]
}
```

---

### 17.3 Register as Seller

```
POST /store/seller-register
```

**Body:**
```json
{
  "name": "Ahmed Al-Salem",
  "email": "ahmed@mystore.kw",
  "phone": "+96599887766",
  "store_name": "Ahmed Electronics",
  "message": "I sell electronics and accessories",
  "documents_urls": [
    "https://...",
    "https://..."
  ]
}
```

**Response 200:**
```json
{
  "request": {
    "id": "selreq_01...",
    "seller_name": "Ahmed Al-Salem",
    "email": "ahmed@mystore.kw",
    "phone": "+96599887766",
    "status": "pending",
    "created_at": "2026-04-09T00:00:00Z"
  }
}
```

---

## 18. Media / Banners / Videos

### 18.1 List Media

```
GET /store/media
```

**Query Params:** `?gallery_id=gal_01...` (optional)

**Response 200:**
```json
{
  "media": [
    {
      "id": "med_01...",
      "url": "https://admin.markasouqs.com/uploads/video1.mp4",
      "mime_type": "video/mp4",
      "title": "Product Demo",
      "title_ar": "عرض المنتج",
      "alt_text": "...",
      "thumbnail_url": "https://...",
      "brand": "Baseus",
      "brand_logo_url": "https://...",
      "views": 1500,
      "display_order": 1,
      "is_featured": true
    }
  ],
  "count": 10
}
```

---

### 18.2 List Banners

```
GET /store/media/banners
```

**Query Params:** `?type=hero` — Options: `hero`, `single`, `dual`, `triple`, `hot_deal`

**Response 200:**
```json
{
  "banners": [
    {
      "id": "ban_01...",
      "link": "/en/categories/electronics",
      "position": "hero",
      "image_url": "https://admin.markasouqs.com/uploads/banner.jpg",
      "media": { "url": "https://admin.markasouqs.com/uploads/banner.jpg" },
      "title": "Summer Sale"
    }
  ],
  "count": 5
}
```

---

### 18.3 List Videos

```
GET /store/media/videos
```

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Max results |
| `offset` | number | 0 | Pagination offset |
| `featured` | boolean | — | `true` = featured videos only |

**Response 200:**
```json
{
  "videos": [
    {
      "id": "med_01...",
      "url": "https://admin.markasouqs.com/uploads/video.mp4",
      "videoUrl": "https://admin.markasouqs.com/uploads/video.mp4",
      "mime_type": "video/mp4",
      "title": "Baseus Product Review",
      "title_ar": "مراجعة منتج بيسوس",
      "thumbnail": "https://...",
      "thumbnail_url": "https://...",
      "brand": "Baseus",
      "brand_logo_url": "https://...",
      "views": 500,
      "is_featured": true
    }
  ],
  "count": 10
}
```

---

### 18.4 List Galleries

```
GET /store/media/galleries
```

**Response 200:**
```json
{
  "galleries": [
    {
      "id": "gal_01...",
      "name": "Featured Products",
      "description": "...",
      "media_ids": ["med_01...", "med_02..."]
    }
  ]
}
```

---

## 19. Filter Options

### 19.1 Get Filter Options (Custom)

```
GET /store/filter-options
```

**Query Params:** `?category_id=pcat_01...` (optional)

**Response 200:**
```json
{
  "filters": [
    {
      "id": "opt_01...",
      "title": "Color",
      "type": "color",
      "values": ["Black", "White", "Blue", "Red"]
    },
    {
      "id": "opt_02...",
      "title": "Size",
      "type": "size",
      "values": ["S", "M", "L", "XL"]
    },
    {
      "id": "brand",
      "title": "Brand",
      "type": "select",
      "values": ["Apple", "Samsung", "Baseus", "Anker"]
    }
  ],
  "price_range": [
    {
      "currency_code": "kwd",
      "min": 500,
      "max": 500000
    }
  ],
  "sort_options": [
    { "value": "created_at", "label": "Newest First" },
    { "value": "-created_at", "label": "Oldest First" },
    { "value": "title", "label": "Name A-Z" },
    { "value": "-title", "label": "Name Z-A" },
    { "value": "price_asc", "label": "Price: Low to High" },
    { "value": "price_desc", "label": "Price: High to Low" }
  ],
  "category_id": "pcat_01..."
}
```

---

## 20. Static Pages

### 20.1 List Available Pages

```
GET /store/pages
```

**Response 200:**
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

---

### 20.2 Get Page Content by Slug

```
GET /store/pages/:slug
```

**Response 200:**
```json
{
  "page": {
    "slug": "about",
    "title": "About MarqaSouq",
    "title_ar": "عن ماركة سوق",
    "content": "MarqaSouq is your premier online destination...",
    "content_ar": "ماركة سوق هي وجهتك الأولى...",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

## 21. Publishable Key

### 21.1 Get Publishable API Key

```
GET /store/publishable-key
```

**Response 200:**
```json
{
  "publishable_key": "pk_01ABC..."
}
```

> 💡 Use this on app startup if you don't want to hardcode the publishable key.

---

## 22. Custom / Delivery Options

### 22.1 Get Delivery Options & Shipping Policy

```
GET /store/custom
```

**Response 200:**
```json
{
  "delivery_options": [
    { "key": "night", "label": "Night Delivery", "label_ar": "توصيل ليلي" },
    { "key": "fast", "label": "Fast Delivery", "label_ar": "توصيل سريع" },
    { "key": "normal", "label": "Normal Delivery", "label_ar": "توصيل عادي" }
  ],
  "shipping_policy": {
    "currency": "KWD",
    "free_delivery_threshold": 7,
    "charge_below_threshold": 1,
    "summary": "Free delivery for 7 KD or above, otherwise 1 KD shipping charge."
  }
}
```

---

## 🔐 Authentication Summary

| Endpoint Pattern | Auth Required | Header |
|---------|-------------|--------|
| `POST /auth/customer/emailpass` | ❌ | — |
| `POST /auth/customer/emailpass/register` | ❌ | — |
| `GET /store/customers/me` | ✅ | `Authorization: Bearer <token>` |
| `GET /store/wishlist` | ✅ | `Authorization: Bearer <token>` |
| `POST /store/wishlist/items` | ✅ | `Authorization: Bearer <token>` |
| `DELETE /store/wishlist/items/:id` | ✅ | `Authorization: Bearer <token>` |
| `GET /store/wishlist/check` | ✅ | `Authorization: Bearer <token>` |
| `GET /store/cart/session` | ✅ | `Authorization: Bearer <token>` |
| `POST /store/cart/session` | ✅ | `Authorization: Bearer <token>` |
| `GET /store/orders` | ✅ | `Authorization: Bearer <token>` |
| All other `/store/*` | ❌ | `x-publishable-api-key` only |

---

## 📝 Quick Reference – All Endpoints

### Store (Public + Customer)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/store/homepage` | ❌ | Homepage data (banners + product sections) |
| `GET` | `/store/products` | ❌ | List products (Medusa built-in) |
| `GET` | `/store/products/:id` | ❌ | Product by ID (Medusa built-in) |
| `GET` | `/store/products/:id/details` | ❌ | Product details (custom, comprehensive) |
| `GET` | `/store/products/:id/reviews` | ❌ | List product reviews |
| `POST` | `/store/products/:id/reviews` | ❌ | Submit a product review |
| `GET` | `/store/products/:id/qa` | ❌ | List Q&A for a product |
| `POST` | `/store/products/:id/qa` | ❌ | Ask a question about a product |
| `GET` | `/store/categories/tree` | ❌ | Full category tree |
| `GET` | `/store/categories/:handle/products` | ❌ | Products in category |
| `GET` | `/store/product-categories` | ❌ | List categories (Medusa built-in) |
| `GET` | `/store/brands` | ❌ | List all brands |
| `GET` | `/store/brands/:slug` | ❌ | Brand + its products |
| `GET` | `/store/filter-options` | ❌ | Colors, sizes, brands, price range |
| `GET` | `/store/custom` | ❌ | Delivery options + shipping policy |
| `GET` | `/store/media` | ❌ | List media items |
| `GET` | `/store/media/banners` | ❌ | List banners by type |
| `GET` | `/store/media/videos` | ❌ | List video media |
| `GET` | `/store/media/galleries` | ❌ | List media galleries |
| `GET` | `/store/pages` | ❌ | List static pages |
| `GET` | `/store/pages/:slug` | ❌ | Static page content |
| `GET` | `/store/blog/posts` | ❌ | List blog posts |
| `GET` | `/store/blog/posts/:slug` | ❌ | Blog post by slug |
| `GET` | `/store/blog/categories` | ❌ | Blog categories |
| `GET` | `/store/sellers` | ❌ | List approved sellers |
| `GET` | `/store/sellers/:id` | ❌ | Seller details |
| `POST` | `/store/seller-register` | ❌ | Register as seller |
| `GET` | `/store/shipping` | ❌ | Shipping options |
| `POST` | `/store/shipping` | ❌ | Validate shipping method |
| `GET` | `/store/warranty` | ❌ | List warranties by email |
| `GET` | `/store/warranty/:id` | ❌ | Warranty details |
| `POST` | `/store/warranty` | ❌ | Register warranty |
| `POST` | `/store/warranty/:id/claim` | ❌ | Submit warranty claim |
| `GET` | `/store/publishable-key` | ❌ | Get publishable API key |
| `GET` | `/store/account/recently-viewed` | ❌ | Recently viewed products |
| `POST` | `/store/account/recently-viewed` | ❌ | Add to recently viewed |
| `POST` | `/store/account/change-password` | ❌ | Change password |
| `POST` | `/store/account/delete` | ❌ | Delete account |
| `POST` | `/auth/customer/emailpass/register` | ❌ | Register |
| `POST` | `/auth/customer/emailpass` | ❌ | Login |
| `GET` | `/store/customers/me` | ✅ | Customer profile |
| `POST` | `/store/customers/me` | ✅ | Update profile |
| `GET` | `/store/customers/me/addresses` | ✅ | List addresses |
| `POST` | `/store/customers/me/addresses` | ✅ | Add address |
| `POST` | `/store/customers/me/addresses/:id` | ✅ | Update address |
| `DELETE` | `/store/customers/me/addresses/:id` | ✅ | Delete address |
| `GET` | `/store/wishlist` | ✅ | Get wishlist |
| `POST` | `/store/wishlist/items` | ✅ | Add to wishlist |
| `DELETE` | `/store/wishlist/items/:id` | ✅ | Remove from wishlist |
| `GET` | `/store/wishlist/check` | ✅ | Check wishlist status |
| `GET` | `/store/cart/session` | ✅ | Get saved cart ID |
| `POST` | `/store/cart/session` | ✅ | Save cart ID |
| `GET` | `/store/orders` | ✅ | List orders |
| `GET` | `/store/orders/:id` | ✅ | Order details |

### Cart (Medusa Built-in)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/store/carts` | Create cart |
| `GET` | `/store/carts/:id` | Get cart |
| `POST` | `/store/carts/:id` | Update cart (address, email, discount) |
| `POST` | `/store/carts/:id/line-items` | Add item |
| `POST` | `/store/carts/:id/line-items/:line_id` | Update quantity |
| `DELETE` | `/store/carts/:id/line-items/:line_id` | Remove item |
| `POST` | `/store/carts/:id/shipping-methods` | Add shipping method |
| `GET` | `/store/shipping-options?cart_id=` | List shipping options |
| `POST` | `/store/carts/:id/payment-sessions` | Create payment sessions |
| `POST` | `/store/carts/:id/payment-session` | Select payment method |
| `POST` | `/store/carts/:id/complete` | Complete cart → create order |
| `GET` | `/store/cart/:id/night-delivery` | Night delivery check (custom) |

### Regions (Medusa Built-in)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/store/regions` | List all regions |

> You need the `region_id` when creating a cart.

---

## 💰 Price Format

All prices from the API are in **minor units** (smallest currency unit):

| Currency | Divisor | Example |
|----------|---------|---------|
| KWD | 1000 | `3990` → `3.990 KWD` |
| AED | 100 | `32000` → `320.00 AED` |
| USD | 100 | `9999` → `99.99 USD` |

**Flutter helper:**
```dart
String formatPrice(int amount, String currencyCode) {
  if (currencyCode.toLowerCase() == 'kwd') {
    return '${(amount / 1000).toStringAsFixed(3)} KD';
  }
  return '${(amount / 100).toStringAsFixed(2)} ${currencyCode.toUpperCase()}';
}
```

---

## 🔑 Flutter Setup Example

```dart
class ApiClient {
  static const String baseUrl = 'https://admin.markasouqs.com';
  static const String publishableKey = 'pk_01ABC...';
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'x-publishable-api-key': publishableKey,
  };
  
  static Map<String, String> authHeaders(String token) => {
    ...headers,
    'Authorization': 'Bearer $token',
  };
}
```

---

## 📊 Stock / In-Stock Logic

Products store stock info in `metadata`:

```dart
bool isInStock(Map<String, dynamic> product) {
  final metadata = product['metadata'] ?? {};
  final stockQty = num.tryParse('${metadata['stock_qty'] ?? 0}') ?? 0;
  return stockQty > 0;
}

String getStockLabel(Map<String, dynamic> product) {
  final metadata = product['metadata'] ?? {};
  final stockQty = num.tryParse('${metadata['stock_qty'] ?? 0}') ?? 0;
  if (stockQty > 10) return 'In Stock';
  if (stockQty > 0) return 'Only $stockQty left';
  return 'Out of Stock';
}
```

---

## 🏷️ Sale Price / Original Price Logic

```dart
double? getSalePrice(Map<String, dynamic> product) {
  final meta = product['metadata'] ?? {};
  final sale = meta['sale_price'];
  if (sale != null) return double.tryParse('$sale');
  // Fallback to variant price
  final variants = product['variants'] as List? ?? [];
  if (variants.isNotEmpty) {
    final prices = variants[0]['prices'] as List? ?? [];
    if (prices.isNotEmpty) return (prices[0]['amount'] as num) / 1000; // KWD
  }
  return null;
}

double? getOriginalPrice(Map<String, dynamic> product) {
  final meta = product['metadata'] ?? {};
  final original = meta['original_price'];
  if (original != null) return double.tryParse('$original');
  return null;
}

bool hasDiscount(Map<String, dynamic> product) {
  final original = getOriginalPrice(product);
  final sale = getSalePrice(product);
  return original != null && sale != null && original > sale;
}
```

---


