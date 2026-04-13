# Marqa Souq - Complete Mobile API Documentation

**Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Base URL:** `https://api.marqasouq.com` (Production) | `http://localhost:9000` (Development)

> **Important Note:** Products and inventory are synced from the client's Odoo ERP system. This API provides real-time data from the integrated backend.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Homepage API](#homepage-api)
4. [Products API](#products-api)
5. [Categories API](#categories-api)
6. [Brands API](#brands-api)
7. [Cart API](#cart-api)
8. [Checkout API](#checkout-api)
9. [Orders API](#orders-api)
10. [Customer Account API](#customer-account-api)
11. [Wishlist API](#wishlist-api)
12. [Reviews API](#reviews-api)
13. [Media & Banners API](#media--banners-api)
14. [Sellers API](#sellers-api)
15. [Warranty API](#warranty-api)
16. [Regions & Shipping API](#regions--shipping-api)
17. [Search API](#search-api)
18. [Data Models](#data-models)
19. [Error Handling](#error-handling)
20. [Rate Limiting](#rate-limiting)

---

## Getting Started

### Required Headers

All store API requests require the publishable API key header:

```http
x-publishable-api-key: pk_your_publishable_key
```

For authenticated endpoints, include the authorization header:

```http
Authorization: Bearer {customer_token}
```

### Content Type

All requests with body content should use:

```http
Content-Type: application/json
```

### Get Publishable Key

```http
GET /store/publishable-key
```

**Response:**
```json
{
  "publishable_key": "pk_3971873a84ad4ec5ea711738227a4be2f078a2fd872f40125628afc860b9887b"
}
```

---

## Authentication

### Customer Registration

```http
POST /auth/customer/emailpass/register
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "securepassword123",
  "first_name": "Ahmed",
  "last_name": "Al-Rashid"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Customer Login

```http
POST /auth/customer/emailpass
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Token

```http
POST /auth/token/refresh
```

**Headers:**
```http
Authorization: Bearer {current_token}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Reset Password - Request

```http
POST /auth/customer/emailpass/reset-password
```

**Request Body:**
```json
{
  "email": "customer@example.com"
}
```

### Reset Password - Confirm

```http
POST /auth/customer/emailpass/reset-password/{token}
```

**Request Body:**
```json
{
  "password": "new_secure_password"
}
```

---

## Homepage API

### Get Homepage Data

Returns all homepage sections including banners, product grids, and featured content.

```http
GET /store/homepage
```

**Query Parameters:**
| Parameter | Type   | Default | Description |
|-----------|--------|---------|-------------|
| `locale`  | string | `en`    | Language code (en/ar) |

**Response (200):**
```json
{
  "locale": "en",
  "generated_at": "2026-01-07T10:30:00.000Z",
  "sections": [
    {
      "id": "hero",
      "type": "banner",
      "items": [
        {
          "id": "banner_01KABC123",
          "title": "Winter Sale - Up to 50% Off",
          "link": "/collections/winter-sale",
          "image_url": "https://api.marqasouq.com/static/uploads/hero-1.avif"
        }
      ]
    },
    {
      "id": "host_deals",
      "type": "product_grid",
      "title": "Host Deals",
      "items": [
        {
          "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
          "type": "product",
          "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8"
        }
      ],
      "products": [
        {
          "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
          "title": "iPhone 15 Pro Max",
          "handle": "iphone-15-pro-max",
          "thumbnail": "https://...",
          "status": "published",
          "collection_id": "pcol_01KA..."
        }
      ]
    },
    {
      "id": "best_in_powerbanks",
      "type": "product_grid",
      "title": "Best in Powerbanks",
      "items": [...],
      "products": [...]
    },
    {
      "id": "best_in_laptops",
      "type": "product_grid",
      "title": "Best in Laptops",
      "items": [...],
      "products": [...]
    },
    {
      "id": "new_arrival",
      "type": "product_grid",
      "title": "New Arrivals",
      "items": [...],
      "products": [...]
    },
    {
      "id": "recommended",
      "type": "product_grid",
      "title": "Recommended",
      "items": [...],
      "products": [...]
    }
  ]
}
```

**Section Types:**
| Type | Description |
|------|-------------|
| `banner` | Hero slider banners |
| `product_grid` | Grid of products from a collection |

---

## Products API

### List Products

```http
GET /store/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page (default: 12, max: 100) |
| `offset` | number | Pagination offset |
| `q` | string | Search query |
| `category_id` | string[] | Filter by category IDs |
| `collection_id` | string[] | Filter by collection IDs |
| `tags` | string[] | Filter by tag IDs |
| `type_id` | string[] | Filter by product type IDs |
| `id` | string[] | Filter by specific product IDs |
| `handle` | string | Get by handle/slug |
| `order` | string | Sort order (`created_at`, `-created_at`, `title`, `-title`) |
| `region_id` | string | **Required for pricing** - Get prices for specific region |
| `currency_code` | string | Currency code (e.g., `omr`, `usd`) |

**Headers:**
```http
x-publishable-api-key: {your_key}
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "title": "iPhone 15 Pro Max 256GB",
      "subtitle": null,
      "description": "The most advanced iPhone ever...",
      "handle": "iphone-15-pro-max-256gb",
      "is_giftcard": false,
      "status": "published",
      "thumbnail": "https://api.marqasouq.com/static/uploads/iphone-15.jpg",
      "weight": 221,
      "length": 160,
      "height": 78,
      "width": 8,
      "hs_code": null,
      "origin_country": null,
      "mid_code": null,
      "material": null,
      "collection_id": "pcol_01KABC...",
      "type_id": "ptyp_01KABC...",
      "discountable": true,
      "external_id": "odoo_12345",
      "created_at": "2025-12-15T10:00:00.000Z",
      "updated_at": "2026-01-05T15:30:00.000Z",
      "deleted_at": null,
      "metadata": {
        "brand_id": "brand_01KABC...",
        "odoo_sync_date": "2026-01-07T08:00:00.000Z"
      },
      "images": [
        {
          "id": "img_01KABC...",
          "url": "https://api.marqasouq.com/static/uploads/iphone-15-1.jpg"
        }
      ],
      "options": [
        {
          "id": "opt_01KABC...",
          "title": "Color",
          "values": [
            { "id": "optval_01...", "value": "Natural Titanium" },
            { "id": "optval_02...", "value": "Blue Titanium" }
          ]
        }
      ],
      "variants": [
        {
          "id": "variant_01KABC...",
          "title": "Natural Titanium / 256GB",
          "sku": "IP15PM-256-NT",
          "barcode": "1234567890123",
          "ean": null,
          "upc": null,
          "inventory_quantity": 50,
          "allow_backorder": false,
          "manage_inventory": true,
          "weight": 221,
          "length": null,
          "height": null,
          "width": null,
          "variant_rank": 0,
          "options": [
            { "id": "optval_01...", "value": "Natural Titanium" }
          ],
          "calculated_price": {
            "id": "price_01KABC...",
            "is_calculated_price_tax_inclusive": true,
            "calculated_amount": 599000,
            "original_amount": 649000,
            "currency_code": "omr",
            "calculated_price": {
              "id": "price_01KABC...",
              "price_list_id": null,
              "price_list_type": null,
              "min_quantity": null,
              "max_quantity": null
            },
            "original_price": {
              "id": "price_02KABC...",
              "price_list_id": null,
              "price_list_type": null,
              "min_quantity": null,
              "max_quantity": null
            }
          }
        }
      ],
      "tags": [
        { "id": "ptag_01KABC...", "value": "smartphone" }
      ],
      "type": {
        "id": "ptyp_01KABC...",
        "value": "Electronics"
      },
      "collection": {
        "id": "pcol_01KABC...",
        "title": "Smartphones",
        "handle": "smartphones"
      }
    }
  ],
  "count": 150,
  "offset": 0,
  "limit": 12
}
```

### Get Single Product

```http
GET /store/products/{id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `region_id` | string | **Required for pricing** |
| `currency_code` | string | Currency code |
| `fields` | string | Comma-separated fields to include |

**Response (200):**
```json
{
  "product": {
    "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
    "title": "iPhone 15 Pro Max 256GB",
    // ... full product object as above
  }
}
```

### Get Product Reviews

```http
GET /store/products/{id}/reviews
```

**Response (200):**
```json
{
  "reviews": [
    {
      "id": "review_01KABC...",
      "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "customer_id": "cus_01KABC...",
      "rating": 5,
      "title": "Excellent phone!",
      "content": "Best iPhone I've ever owned. Battery life is amazing.",
      "status": "approved",
      "created_at": "2026-01-05T12:00:00.000Z"
    }
  ]
}
```

### Submit Product Review (Auth Required)

```http
POST /store/products/{id}/reviews
```

**Headers:**
```http
Authorization: Bearer {customer_token}
```

**Request Body:**
```json
{
  "rating": 5,
  "title": "Great product!",
  "content": "I love this phone. Highly recommended!"
}
```

**Response (200):**
```json
{
  "review": {
    "id": "review_01KABC...",
    "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
    "customer_id": "cus_01KABC...",
    "rating": 5,
    "title": "Great product!",
    "content": "I love this phone. Highly recommended!",
    "status": "pending"
  }
}
```

---

## Categories API

### List Categories

```http
GET /store/product-categories
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `parent_category_id` | string | Filter by parent (null for root) |
| `include_descendants_tree` | boolean | Include nested children |
| `fields` | string | Fields to include |

**Response (200):**
```json
{
  "product_categories": [
    {
      "id": "pcat_01KABC...",
      "name": "Electronics",
      "description": "All electronic devices and accessories",
      "handle": "electronics",
      "is_active": true,
      "is_internal": false,
      "rank": 0,
      "parent_category_id": null,
      "created_at": "2025-12-01T10:00:00.000Z",
      "updated_at": "2025-12-01T10:00:00.000Z",
      "metadata": {
        "icon_url": "/category/electronic.avif"
      },
      "category_children": [
        {
          "id": "pcat_02KABC...",
          "name": "Smartphones",
          "handle": "smartphones",
          "parent_category_id": "pcat_01KABC..."
        },
        {
          "id": "pcat_03KABC...",
          "name": "Laptops",
          "handle": "laptops",
          "parent_category_id": "pcat_01KABC..."
        }
      ]
    },
    {
      "id": "pcat_10KABC...",
      "name": "Home & Kitchen",
      "handle": "home-kitchen",
      "metadata": {
        "icon_url": "/category/kitchen.avif"
      }
    }
  ],
  "count": 8,
  "offset": 0,
  "limit": 100
}
```

### Get Single Category

```http
GET /store/product-categories/{id}
```

**Response (200):**
```json
{
  "product_category": {
    "id": "pcat_01KABC...",
    "name": "Electronics",
    // ... full category object
  }
}
```

---

## Brands API

### List Brands

```http
GET /store/brands
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Items per page |
| `offset` | number | 0 | Pagination offset |

**Response (200):**
```json
{
  "brands": [
    {
      "id": "brand_01KABC...",
      "name": "Apple",
      "slug": "apple",
      "description": "Premium electronics and innovative technology",
      "logo_url": "/brands/apple.svg",
      "banner_url": "https://...",
      "is_active": true,
      "meta_title": "Apple Products - Marqa Souq",
      "meta_description": "Shop the latest Apple products",
      "display_order": 1,
      "product_count": 45
    },
    {
      "id": "brand_02KABC...",
      "name": "Samsung",
      "slug": "samsung",
      "logo_url": "/brands/samsung.svg",
      "is_active": true,
      "display_order": 2,
      "product_count": 38
    }
  ],
  "count": 25,
  "limit": 20,
  "offset": 0
}
```

### Get Brand by Slug with Products

```http
GET /store/brands/{slug}
```

**Response (200):**
```json
{
  "brand": {
    "id": "brand_01KABC...",
    "name": "Apple",
    "slug": "apple",
    "description": "Premium electronics and innovative technology",
    "logo_url": "/brands/apple.svg",
    "banner_url": "https://...",
    "is_active": true,
    "meta_title": "Apple Products - Marqa Souq",
    "meta_description": "Shop the latest Apple products",
    "display_order": 1
  },
  "products": [
    {
      "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "title": "iPhone 15 Pro Max",
      // ... product objects
    }
  ]
}
```

---

## Cart API

### Create Cart

```http
POST /store/carts
```

**Request Body:**
```json
{
  "region_id": "reg_01KAARY0EYGZY423VSZV7DVX25",
  "sales_channel_id": "sc_01KABC...",
  "context": {
    "ip": "192.168.1.1",
    "user_agent": "Marqa Souq Mobile App/1.0"
  }
}
```

**Response (200):**
```json
{
  "cart": {
    "id": "cart_01KABC...",
    "email": null,
    "billing_address_id": null,
    "shipping_address_id": null,
    "region_id": "reg_01KAARY0EYGZY423VSZV7DVX25",
    "currency_code": "omr",
    "items": [],
    "subtotal": 0,
    "tax_total": 0,
    "shipping_total": 0,
    "discount_total": 0,
    "total": 0,
    "created_at": "2026-01-07T10:00:00.000Z"
  }
}
```

### Get Cart

```http
GET /store/carts/{id}
```

**Response (200):**
```json
{
  "cart": {
    "id": "cart_01KABC...",
    "email": "customer@example.com",
    "region_id": "reg_01KAARY0EYGZY423VSZV7DVX25",
    "currency_code": "omr",
    "items": [
      {
        "id": "item_01KABC...",
        "cart_id": "cart_01KABC...",
        "title": "iPhone 15 Pro Max 256GB - Natural Titanium",
        "description": "Natural Titanium / 256GB",
        "thumbnail": "https://...",
        "quantity": 1,
        "unit_price": 599000,
        "variant_id": "variant_01KABC...",
        "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
        "subtotal": 599000,
        "tax_total": 0,
        "total": 599000,
        "discount_total": 0,
        "variant": {
          "id": "variant_01KABC...",
          "title": "Natural Titanium / 256GB",
          "sku": "IP15PM-256-NT",
          "product": {
            "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
            "title": "iPhone 15 Pro Max 256GB",
            "thumbnail": "https://..."
          }
        }
      }
    ],
    "shipping_address": null,
    "billing_address": null,
    "shipping_methods": [],
    "payment_sessions": [],
    "subtotal": 599000,
    "tax_total": 0,
    "shipping_total": 0,
    "discount_total": 0,
    "gift_card_total": 0,
    "total": 599000
  }
}
```

### Add Item to Cart

```http
POST /store/carts/{id}/line-items
```

**Request Body:**
```json
{
  "variant_id": "variant_01KABC...",
  "quantity": 1
}
```

**Response (200):**
```json
{
  "cart": {
    // ... updated cart object
  }
}
```

### Update Line Item

```http
POST /store/carts/{id}/line-items/{line_id}
```

**Request Body:**
```json
{
  "quantity": 2
}
```

### Remove Line Item

```http
DELETE /store/carts/{id}/line-items/{line_id}
```

### Update Cart

```http
POST /store/carts/{id}
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "billing_address": {
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "address_1": "123 Main Street",
    "city": "Muscat",
    "country_code": "om",
    "postal_code": "100",
    "phone": "+96812345678"
  },
  "shipping_address": {
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "address_1": "123 Main Street",
    "city": "Muscat",
    "country_code": "om",
    "postal_code": "100",
    "phone": "+96812345678"
  },
  "discounts": [
    { "code": "WINTER10" }
  ]
}
```

### Add Shipping Method

```http
POST /store/carts/{id}/shipping-methods
```

**Request Body:**
```json
{
  "option_id": "so_01KABC..."
}
```

### Initialize Payment Session

```http
POST /store/carts/{id}/payment-sessions
```

**Request Body:**
```json
{
  "provider_id": "manual"
}
```

Available Payment Providers:
- `manual` - Cash on Delivery (COD)
- `stripe` - Credit/Debit Card
- `paypal` - PayPal

### Select Payment Session

```http
POST /store/carts/{id}/payment-session
```

**Request Body:**
```json
{
  "provider_id": "manual"
}
```

---

## Checkout API

### Complete Cart (Place Order)

```http
POST /store/carts/{id}/complete
```

**Response (200):**
```json
{
  "type": "order",
  "order": {
    "id": "order_01KABC...",
    "display_id": 1001,
    "status": "pending",
    "fulfillment_status": "not_fulfilled",
    "payment_status": "awaiting",
    "email": "customer@example.com",
    "currency_code": "omr",
    "customer_id": "cus_01KABC...",
    "items": [...],
    "shipping_address": {...},
    "billing_address": {...},
    "shipping_methods": [...],
    "payments": [...],
    "subtotal": 599000,
    "tax_total": 0,
    "shipping_total": 5000,
    "discount_total": 0,
    "total": 604000,
    "created_at": "2026-01-07T11:00:00.000Z"
  }
}
```

---

## Orders API

### List Customer Orders (Auth Required)

```http
GET /store/orders
```

**Headers:**
```http
Authorization: Bearer {customer_token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `status` | string | Filter by status |

**Response (200):**
```json
{
  "orders": [
    {
      "id": "order_01KABC...",
      "display_id": 1001,
      "status": "completed",
      "fulfillment_status": "shipped",
      "payment_status": "captured",
      "email": "customer@example.com",
      "currency_code": "omr",
      "items": [
        {
          "id": "item_01KABC...",
          "title": "iPhone 15 Pro Max 256GB",
          "quantity": 1,
          "unit_price": 599000,
          "thumbnail": "https://..."
        }
      ],
      "subtotal": 599000,
      "shipping_total": 5000,
      "total": 604000,
      "created_at": "2026-01-05T10:00:00.000Z",
      "shipped_at": "2026-01-06T14:00:00.000Z"
    }
  ],
  "count": 5,
  "offset": 0,
  "limit": 10
}
```

### Get Order Details

```http
GET /store/orders/{id}
```

**Response (200):**
```json
{
  "order": {
    "id": "order_01KABC...",
    "display_id": 1001,
    "status": "completed",
    "fulfillment_status": "shipped",
    "payment_status": "captured",
    "email": "customer@example.com",
    "currency_code": "omr",
    "customer_id": "cus_01KABC...",
    "customer": {
      "id": "cus_01KABC...",
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid"
    },
    "items": [...],
    "shipping_address": {
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "address_1": "123 Main Street",
      "city": "Muscat",
      "country_code": "om",
      "postal_code": "100",
      "phone": "+96812345678"
    },
    "billing_address": {...},
    "shipping_methods": [
      {
        "id": "sm_01KABC...",
        "shipping_option": {
          "id": "so_01KABC...",
          "name": "Standard Delivery"
        },
        "price": 5000
      }
    ],
    "payments": [
      {
        "id": "pay_01KABC...",
        "amount": 604000,
        "currency_code": "omr",
        "provider_id": "manual",
        "captured_at": null
      }
    ],
    "fulfillments": [
      {
        "id": "ful_01KABC...",
        "tracking_numbers": ["OM123456789"],
        "tracking_links": [
          {
            "tracking_number": "OM123456789",
            "url": "https://tracking.example.com/OM123456789"
          }
        ],
        "shipped_at": "2026-01-06T14:00:00.000Z"
      }
    ],
    "subtotal": 599000,
    "tax_total": 0,
    "shipping_total": 5000,
    "discount_total": 0,
    "total": 604000,
    "created_at": "2026-01-05T10:00:00.000Z"
  }
}
```

---

## Customer Account API

### Get Customer Profile (Auth Required)

```http
GET /store/customers/me
```

**Headers:**
```http
Authorization: Bearer {customer_token}
```

**Response (200):**
```json
{
  "customer": {
    "id": "cus_01KABC...",
    "email": "customer@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "phone": "+96812345678",
    "has_account": true,
    "created_at": "2025-12-01T10:00:00.000Z",
    "metadata": {
      "preferred_language": "ar"
    },
    "shipping_addresses": [
      {
        "id": "addr_01KABC...",
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "address_1": "123 Main Street",
        "city": "Muscat",
        "country_code": "om",
        "postal_code": "100",
        "phone": "+96812345678"
      }
    ]
  }
}
```

### Update Customer Profile

```http
POST /store/customers/me
```

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Rashid",
  "phone": "+96812345678",
  "metadata": {
    "preferred_language": "ar"
  }
}
```

### Add Shipping Address

```http
POST /store/customers/me/addresses
```

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Rashid",
  "address_1": "123 Main Street",
  "address_2": "Apartment 5",
  "city": "Muscat",
  "country_code": "om",
  "postal_code": "100",
  "phone": "+96812345678",
  "metadata": {
    "label": "Home"
  }
}
```

### Update Shipping Address

```http
POST /store/customers/me/addresses/{address_id}
```

### Delete Shipping Address

```http
DELETE /store/customers/me/addresses/{address_id}
```

---

## Wishlist API

### Get Wishlist (Auth Required)

```http
GET /store/wishlist
```

**Headers:**
```http
Authorization: Bearer {customer_token}
```

**Response (200):**
```json
{
  "customer_id": "cus_01KABC...",
  "items": [
    {
      "id": "witem_01KABC...",
      "wishlist_id": "wlist_01KABC...",
      "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "variant_id": "variant_01KABC...",
      "created_at": "2026-01-05T10:00:00.000Z"
    }
  ],
  "products": [
    {
      "id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "title": "iPhone 15 Pro Max 256GB",
      "thumbnail": "https://...",
      "handle": "iphone-15-pro-max-256gb"
    }
  ]
}
```

### Add to Wishlist (Auth Required)

```http
POST /store/wishlist/items
```

**Headers:**
```http
Authorization: Bearer {customer_token}
```

**Request Body:**
```json
{
  "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
  "variant_id": "variant_01KABC..."
}
```

**Response (200):**
```json
{
  "item": {
    "id": "witem_01KABC...",
    "wishlist_id": "wlist_01KABC...",
    "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
    "variant_id": "variant_01KABC..."
  }
}
```

### Remove from Wishlist (Auth Required)

```http
DELETE /store/wishlist/items/{item_id}
```

**Response (200):**
```json
{
  "id": "witem_01KABC...",
  "object": "wishlist_item",
  "deleted": true
}
```

---

## Reviews API

See [Products API - Get Product Reviews](#get-product-reviews) and [Submit Product Review](#submit-product-review-auth-required) sections.

---

## Media & Banners API

### Get Banners

```http
GET /store/media/banners
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Banner type: `hero`, `single`, `dual`, `triple` |

**Response (200):**
```json
{
  "banners": [
    {
      "id": "banner_01KABC...",
      "link": "/collections/winter-sale",
      "position": "hero",
      "image_url": "https://api.marqasouq.com/static/uploads/hero-1.avif",
      "media": {
        "url": "https://api.marqasouq.com/static/uploads/hero-1.avif"
      },
      "title": "Winter Sale - Up to 50% Off"
    }
  ]
}
```

### Get Videos

```http
GET /store/media/videos
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Items per page |
| `offset` | number | 0 | Pagination offset |
| `featured` | boolean | false | Filter featured videos only |

**Response (200):**
```json
{
  "videos": [
    {
      "id": "media_01KABC...",
      "url": "https://api.marqasouq.com/static/uploads/promo-video.mp4",
      "videoUrl": "https://api.marqasouq.com/static/uploads/promo-video.mp4",
      "mime_type": "video/mp4",
      "title": "New iPhone 15 Pro Max",
      "title_ar": "آيفون 15 برو ماكس الجديد",
      "titleAr": "آيفون 15 برو ماكس الجديد",
      "alt_text": "iPhone 15 promotional video",
      "thumbnail": "https://api.marqasouq.com/static/uploads/promo-thumb.jpg",
      "thumbnail_url": "https://api.marqasouq.com/static/uploads/promo-thumb.jpg",
      "brand": "Apple",
      "views": 1523,
      "display_order": 1,
      "is_featured": true
    }
  ],
  "count": 5
}
```

### Get Media Items

```http
GET /store/media
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `gallery_id` | string | Filter by gallery ID |

**Response (200):**
```json
{
  "media": [
    {
      "id": "media_01KABC...",
      "url": "https://api.marqasouq.com/static/uploads/image.jpg",
      "mime_type": "image/jpeg",
      "title": "Product Showcase",
      "alt_text": "Product showcase image",
      "thumbnail_url": "https://api.marqasouq.com/static/uploads/image-thumb.jpg",
      "metadata": null
    }
  ],
  "count": 10
}
```

### Get Galleries

```http
GET /store/media/galleries
```

**Response (200):**
```json
{
  "galleries": [
    {
      "id": "gallery_01KABC...",
      "title": "Product Highlights",
      "description": "Featured product images",
      "media_ids": ["media_01...", "media_02...", "media_03..."]
    }
  ]
}
```

---

## Sellers API

### List Approved Sellers

```http
GET /store/sellers
```

**Response (200):**
```json
{
  "sellers": [
    {
      "id": "seller_01KABC...",
      "name": "Tech Store Oman",
      "email": "seller@techstore.om",
      "phone": "+968 12345678",
      "legal_name": "Tech Store LLC",
      "tax_id": "OM123456789",
      "logo_url": "https://...",
      "status": "approved",
      "address_json": {
        "city": "Muscat",
        "country": "Oman"
      }
    }
  ],
  "count": 15
}
```

### Get Seller Details

```http
GET /store/sellers/{id}
```

**Response (200):**
```json
{
  "seller": {
    "id": "seller_01KABC...",
    "name": "Tech Store Oman",
    "email": "seller@techstore.om",
    "phone": "+968 12345678",
    "legal_name": "Tech Store LLC",
    "logo_url": "https://...",
    "status": "approved"
  },
  "product_links": [
    {
      "seller_id": "seller_01KABC...",
      "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8"
    }
  ]
}
```

### Seller Registration Request

```http
POST /store/seller-register
```

**Request Body:**
```json
{
  "name": "New Seller Store",
  "email": "newseller@example.com",
  "phone": "+96812345678",
  "store_name": "My Store",
  "message": "I would like to become a seller on Marqa Souq",
  "documents_urls": [
    "https://example.com/documents/license.pdf"
  ]
}
```

**Response (200):**
```json
{
  "request": {
    "id": "sreq_01KABC...",
    "seller_name": "New Seller Store",
    "email": "newseller@example.com",
    "phone": "+96812345678",
    "status": "pending",
    "notes": "I would like to become a seller on Marqa Souq",
    "documents_urls": ["https://example.com/documents/license.pdf"],
    "metadata": {
      "store_name": "My Store"
    }
  }
}
```

---

## Warranty API

### Get Warranty by Email

```http
GET /store/warranty
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Customer email |

**Response (200):**
```json
{
  "warranties": [
    {
      "id": "warranty_01KABC...",
      "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
      "order_id": "order_01KABC...",
      "order_item_id": "item_01KABC...",
      "customer_email": "customer@example.com",
      "type": "manufacturer",
      "duration_months": 12,
      "start_date": "2026-01-05T10:00:00.000Z",
      "end_date": "2027-01-05T10:00:00.000Z",
      "status": "active",
      "terms": "Standard manufacturer warranty covering defects..."
    }
  ],
  "count": 2
}
```

### Get Warranty by ID

```http
GET /store/warranty/{id}
```

**Response (200):**
```json
{
  "warranty": {
    "id": "warranty_01KABC...",
    "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
    "order_id": "order_01KABC...",
    "customer_email": "customer@example.com",
    "type": "manufacturer",
    "duration_months": 12,
    "start_date": "2026-01-05T10:00:00.000Z",
    "end_date": "2027-01-05T10:00:00.000Z",
    "status": "active"
  }
}
```

### Register Warranty

```http
POST /store/warranty
```

**Request Body:**
```json
{
  "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
  "customer_email": "customer@example.com",
  "type": "manufacturer",
  "duration_months": 12,
  "order_id": "order_01KABC...",
  "order_item_id": "item_01KABC..."
}
```

**Response (201):**
```json
{
  "warranty": {
    "id": "warranty_01KABC...",
    "product_id": "prod_01KAARY0K50J8DGR8W7BYPASJ8",
    "customer_email": "customer@example.com",
    "type": "manufacturer",
    "duration_months": 12,
    "start_date": "2026-01-07T10:00:00.000Z",
    "end_date": "2027-01-07T10:00:00.000Z",
    "status": "active"
  }
}
```

---

## Regions & Shipping API

### List Regions

```http
GET /store/regions
```

**Response (200):**
```json
{
  "regions": [
    {
      "id": "reg_01KAARY0EYGZY423VSZV7DVX25",
      "name": "Oman",
      "currency_code": "omr",
      "tax_rate": 0,
      "tax_code": null,
      "countries": [
        {
          "id": 512,
          "iso_2": "om",
          "iso_3": "omn",
          "name": "Oman",
          "display_name": "Oman",
          "num_code": 512
        }
      ],
      "payment_providers": [
        { "id": "manual" }
      ],
      "fulfillment_providers": [
        { "id": "manual" }
      ]
    }
  ]
}
```

### Get Region by ID

```http
GET /store/regions/{id}
```

### Get Shipping Options for Cart

```http
GET /store/shipping-options/{cart_id}
```

**Response (200):**
```json
{
  "shipping_options": [
    {
      "id": "so_01KABC...",
      "name": "Standard Delivery",
      "amount": 5000,
      "price_incl_tax": 5000,
      "is_return": false,
      "admin_only": false,
      "region_id": "reg_01KAARY0EYGZY423VSZV7DVX25",
      "provider_id": "manual",
      "data": {},
      "metadata": {
        "delivery_days": "3-5"
      }
    },
    {
      "id": "so_02KABC...",
      "name": "Express Delivery",
      "amount": 15000,
      "price_incl_tax": 15000,
      "is_return": false,
      "admin_only": false,
      "metadata": {
        "delivery_days": "1-2"
      }
    }
  ]
}
```

---

## Search API

### Search Products

Use the Products API with search parameters:

```http
GET /store/products?q=iphone&region_id=reg_01KAARY0EYGZY423VSZV7DVX25
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (searches title, description, SKU) |
| `category_id` | string[] | Filter by category |
| `collection_id` | string[] | Filter by collection |
| `tags` | string[] | Filter by tags |
| `limit` | number | Results per page |
| `offset` | number | Pagination offset |

---

## Collections API

### List Collections

```http
GET /store/collections
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `handle` | string | Get by handle/slug |

**Response (200):**
```json
{
  "collections": [
    {
      "id": "pcol_01KABC...",
      "title": "Hot Deals",
      "handle": "hot-deals",
      "created_at": "2025-12-01T10:00:00.000Z",
      "updated_at": "2025-12-01T10:00:00.000Z",
      "metadata": {
        "icon": "🔥"
      }
    },
    {
      "id": "pcol_02KABC...",
      "title": "New Arrivals",
      "handle": "new-arrival"
    }
  ],
  "count": 10,
  "offset": 0,
  "limit": 100
}
```

### Get Collection by ID

```http
GET /store/collections/{id}
```

---

## Data Models

### Product Object

```typescript
interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  handle: string;
  is_giftcard: boolean;
  status: "draft" | "proposed" | "published" | "rejected";
  thumbnail: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  collection_id: string | null;
  type_id: string | null;
  discountable: boolean;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, any> | null;
  images: Image[];
  options: ProductOption[];
  variants: ProductVariant[];
  tags: ProductTag[];
  type: ProductType | null;
  collection: ProductCollection | null;
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  ean: string | null;
  upc: string | null;
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  variant_rank: number;
  options: OptionValue[];
  calculated_price: CalculatedPrice | null;
}

interface CalculatedPrice {
  id: string;
  is_calculated_price_tax_inclusive: boolean;
  calculated_amount: number; // Amount in smallest currency unit (e.g., baisa for OMR)
  original_amount: number;
  currency_code: string;
}
```

### Cart Object

```typescript
interface Cart {
  id: string;
  email: string | null;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  region_id: string;
  currency_code: string;
  items: LineItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_methods: ShippingMethod[];
  payment_sessions: PaymentSession[];
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  gift_card_total: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface LineItem {
  id: string;
  cart_id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  variant_id: string;
  product_id: string;
  subtotal: number;
  tax_total: number;
  total: number;
  discount_total: number;
  variant: ProductVariant;
}
```

### Order Object

```typescript
interface Order {
  id: string;
  display_id: number;
  status: "pending" | "completed" | "archived" | "canceled" | "requires_action";
  fulfillment_status: "not_fulfilled" | "partially_fulfilled" | "fulfilled" | "partially_shipped" | "shipped" | "partially_returned" | "returned" | "canceled" | "requires_action";
  payment_status: "not_paid" | "awaiting" | "captured" | "partially_refunded" | "refunded" | "canceled" | "requires_action";
  email: string;
  currency_code: string;
  customer_id: string;
  customer: Customer;
  items: LineItem[];
  shipping_address: Address;
  billing_address: Address;
  shipping_methods: ShippingMethod[];
  payments: Payment[];
  fulfillments: Fulfillment[];
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  created_at: string;
  updated_at: string;
}
```

### Address Object

```typescript
interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  company?: string | null;
  address_1: string;
  address_2?: string | null;
  city: string;
  country_code: string;
  province?: string | null;
  postal_code: string;
  phone: string;
  metadata?: Record<string, any> | null;
}
```

### Brand Object

```typescript
interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  display_order: number;
  product_count?: number;
}
```

### Review Object

```typescript
interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number; // 1-5
  title: string | null;
  content: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
```

### Warranty Object

```typescript
interface Warranty {
  id: string;
  product_id: string;
  order_id: string | null;
  order_item_id: string | null;
  customer_email: string;
  type: "manufacturer" | "seller" | "extended";
  duration_months: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "expired" | "void";
  terms: string | null;
  metadata: Record<string, any> | null;
}
```

---

## Error Handling

### Error Response Format

```json
{
  "type": "invalid_data",
  "message": "Invalid request body",
  "errors": [
    {
      "field": "email",
      "message": "email is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Common Error Types

| Type | Description |
|------|-------------|
| `invalid_data` | Request body validation failed |
| `not_found` | Requested resource not found |
| `unauthorized` | Authentication required |
| `duplicate_error` | Resource already exists |
| `invalid_state_error` | Operation not allowed in current state |

---

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Store API:** 100 requests per minute per IP
- **Authenticated Endpoints:** 200 requests per minute per customer

Rate limit headers in response:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704628800
```

---

## Currency & Price Formatting

### Currency Units

All prices are returned in the smallest currency unit:

| Currency | Unit | Example |
|----------|------|---------|
| OMR (Omani Rial) | Baisa (1/1000) | 599000 = 599.000 OMR |
| USD | Cents (1/100) | 59900 = 599.00 USD |
| AED | Fils (1/100) | 219900 = 2199.00 AED |

### Price Formatting Example (Dart)

```dart
String formatPrice(int amount, String currencyCode) {
  switch (currencyCode.toLowerCase()) {
    case 'omr':
      return 'OMR ${(amount / 1000).toStringAsFixed(3)}';
    case 'usd':
      return '\$${(amount / 100).toStringAsFixed(2)}';
    case 'aed':
      return 'AED ${(amount / 100).toStringAsFixed(2)}';
    default:
      return '${(amount / 100).toStringAsFixed(2)} ${currencyCode.toUpperCase()}';
  }
}
```

---

## Notes for Flutter Implementation

### Important Considerations

1. **Publishable API Key**: Always include `x-publishable-api-key` header in all requests
2. **Region ID for Pricing**: Include `region_id` parameter when fetching products to get calculated prices
3. **Token Storage**: Store JWT tokens securely using flutter_secure_storage
4. **Image URLs**: All image URLs are absolute and can be used directly in `Image.network()`
5. **Offline Support**: Consider caching homepage and product data for offline viewing
6. **RTL Support**: Arabic content is available in `title_ar` fields where applicable

### Recommended Flutter Packages

```yaml
dependencies:
  dio: ^5.4.0              # HTTP client
  flutter_secure_storage: ^9.0.0  # Secure token storage
  cached_network_image: ^3.3.0    # Image caching
  infinite_scroll_pagination: ^4.0.0  # Pagination
  provider: ^6.1.0          # State management
  intl: ^0.18.0            # Internationalization
```

### Example API Service (Dart)

```dart
import 'package:dio/dio.dart';

class MarqaSouqApi {
  static const String baseUrl = 'https://api.marqasouq.com';
  static const String publishableKey = 'pk_your_key';
  
  late final Dio _dio;
  String? _authToken;
  
  MarqaSouqApi() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'x-publishable-api-key': publishableKey,
        'Content-Type': 'application/json',
      },
    ));
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
    ));
  }
  
  void setAuthToken(String? token) {
    _authToken = token;
  }
  
  Future<Map<String, dynamic>> getHomepage({String locale = 'en'}) async {
    final response = await _dio.get('/store/homepage', 
      queryParameters: {'locale': locale});
    return response.data;
  }
  
  Future<Map<String, dynamic>> getProducts({
    String? query,
    String? categoryId,
    required String regionId,
    int limit = 12,
    int offset = 0,
  }) async {
    final response = await _dio.get('/store/products', 
      queryParameters: {
        if (query != null) 'q': query,
        if (categoryId != null) 'category_id': categoryId,
        'region_id': regionId,
        'limit': limit,
        'offset': offset,
      });
    return response.data;
  }
  
  Future<Map<String, dynamic>> getProduct(String id, String regionId) async {
    final response = await _dio.get('/store/products/$id',
      queryParameters: {'region_id': regionId});
    return response.data;
  }
  
  // Add more methods as needed...
}
```

---

## Contact & Support

For API-related questions or issues:
- **Email**: api-support@marqasouq.com
- **Documentation**: https://docs.marqasouq.com
- **Status Page**: https://status.marqasouq.com

---

*This documentation is auto-generated and may be updated. Last sync with codebase: January 7, 2026*
