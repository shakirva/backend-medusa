# Odoo ERP Integration Requirements for Marqa Souq E-Commerce

**Document Version:** 1.0  
**Date:** January 7, 2026  
**Purpose:** Define API requirements from Odoo ERP for product and inventory synchronization with MedusaJS e-commerce platform

---

## 📋 Overview

Our e-commerce platform (Marqa Souq) uses **MedusaJS** as the backend and **does NOT create products from our admin dashboard**. All products and inventory data come from the client's **Odoo ERP system**. 

This document outlines what APIs and data we need from the Odoo developer to complete the integration.

---

## 🔄 Integration Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│    Odoo ERP     │ ──API──▶│  Integration     │ ──API──▶│   MedusaJS      │
│  (Source of     │◀──────── │  Middleware      │◀──────── │   E-commerce    │
│   Truth)        │         │  (Python/Node)   │         │   Platform      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                                                         │
        │  Products, Categories,                                  │
        │  Inventory, Prices                      Orders, Customers │
        └─────────────────────────────────────────────────────────┘
```

### Data Flow Direction:
- **Odoo → MedusaJS:** Products, Categories, Brands, Inventory, Prices
- **MedusaJS → Odoo:** Orders, Customer data, Payment confirmations

---

## 🔐 1. Authentication API Requirements

We need Odoo to provide:

| Item | Description | Required |
|------|-------------|----------|
| **API Base URL** | Odoo server URL (e.g., `https://odoo.client.com`) | ✅ Yes |
| **Database Name** | Odoo database to connect to | ✅ Yes |
| **API User Credentials** | Username & password or API key for authentication | ✅ Yes |
| **Authentication Method** | XML-RPC, JSON-RPC, or REST API | ✅ Yes |
| **API Rate Limits** | Requests per minute/hour limits | ✅ Yes |
| **IP Whitelisting** | If required, we'll provide our server IPs | Optional |

### Preferred Authentication:
```json
{
  "method": "JSON-RPC or REST API",
  "endpoint": "/web/session/authenticate",
  "credentials": {
    "db": "database_name",
    "login": "api_user@company.com",
    "password": "api_key_or_password"
  }
}
```

---

## 📦 2. Products API Requirements

### 2.1 Required Product Fields

| Odoo Field | MedusaJS Field | Type | Required | Description |
|------------|----------------|------|----------|-------------|
| `id` | `external_id` | Integer | ✅ | Unique Odoo product ID |
| `default_code` | `sku` | String | ✅ | Product SKU/Barcode |
| `name` | `title` | String | ✅ | Product name |
| `description_sale` | `description` | Text | ✅ | Product description |
| `list_price` | `price` | Float | ✅ | Selling price |
| `standard_price` | `cost_price` | Float | Optional | Cost price |
| `active` | `status` | Boolean | ✅ | Is product active |
| `categ_id` | `category_id` | Many2One | ✅ | Product category |
| `weight` | `weight` | Float | ✅ | Product weight (kg) |
| `image_1920` | `thumbnail` | Base64/URL | ✅ | Main product image |
| `product_template_image_ids` | `images` | Array | Optional | Additional images |
| `barcode` | `barcode` | String | Optional | Product barcode |

### 2.2 Product Variants Fields

| Odoo Field | MedusaJS Field | Type | Required | Description |
|------------|----------------|------|----------|-------------|
| `product_template_id` | `product_id` | Integer | ✅ | Parent product ID |
| `default_code` | `sku` | String | ✅ | Variant SKU |
| `product_template_attribute_value_ids` | `options` | Array | ✅ | Variant attributes (Size, Color, etc.) |
| `lst_price` | `price` | Float | ✅ | Variant price |

### 2.3 Expected API Endpoints

```
GET /api/products                    # List all products
GET /api/products/{id}               # Get single product
GET /api/products?updated_after=     # Get products updated after timestamp
GET /api/products/variants           # Get all product variants
```

### 2.4 Sample Product JSON Response Needed

```json
{
  "products": [
    {
      "id": 123,
      "default_code": "PHONE-001",
      "name": "iPhone 15 Pro Max",
      "name_ar": "آيفون 15 برو ماكس",
      "description_sale": "Latest Apple flagship phone",
      "description_sale_ar": "أحدث هاتف رائد من Apple",
      "list_price": 4999.00,
      "currency": "AED",
      "active": true,
      "categ_id": {
        "id": 5,
        "name": "Electronics > Mobile Phones"
      },
      "brand_id": {
        "id": 1,
        "name": "Apple",
        "logo_url": "https://odoo.example.com/brand/apple.png"
      },
      "weight": 0.221,
      "images": [
        "https://odoo.example.com/products/123/image1.jpg",
        "https://odoo.example.com/products/123/image2.jpg"
      ],
      "variants": [
        {
          "id": 124,
          "sku": "PHONE-001-256-BLACK",
          "attributes": {
            "Storage": "256GB",
            "Color": "Black"
          },
          "price": 4999.00,
          "stock_quantity": 50
        },
        {
          "id": 125,
          "sku": "PHONE-001-512-WHITE",
          "attributes": {
            "Storage": "512GB",
            "Color": "White"
          },
          "price": 5499.00,
          "stock_quantity": 30
        }
      ],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-07T10:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "per_page": 100
}
```

---

## 📊 3. Inventory API Requirements

### 3.1 Required Inventory Fields

| Odoo Field | MedusaJS Field | Type | Required | Description |
|------------|----------------|------|----------|-------------|
| `product_id` | `variant_id` | Integer | ✅ | Product/Variant ID |
| `default_code` | `sku` | String | ✅ | Product SKU |
| `qty_available` | `stocked_quantity` | Float | ✅ | Available quantity |
| `virtual_available` | `reserved_quantity` | Float | Optional | Reserved/Forecasted qty |
| `location_id` | `location_id` | Integer | ✅ | Warehouse location |
| `warehouse_id` | `warehouse_code` | String | Optional | Warehouse identifier |

### 3.2 Expected API Endpoints

```
GET /api/inventory                          # Get all inventory levels
GET /api/inventory/{product_id}             # Get inventory for specific product
GET /api/inventory?updated_after=           # Get inventory changes after timestamp
POST /api/inventory/reserve                 # Reserve inventory for order
POST /api/inventory/release                 # Release reserved inventory
```

### 3.3 Sample Inventory JSON Response Needed

```json
{
  "inventory": [
    {
      "product_id": 123,
      "sku": "PHONE-001-256-BLACK",
      "warehouse_id": "WH-DUBAI",
      "warehouse_name": "Dubai Main Warehouse",
      "qty_available": 50,
      "qty_reserved": 5,
      "qty_incoming": 100,
      "qty_outgoing": 10,
      "last_updated": "2025-01-07T10:30:00Z"
    }
  ]
}
```

---

## 🏷️ 4. Categories API Requirements

### 4.1 Required Category Fields

| Odoo Field | MedusaJS Field | Type | Required |
|------------|----------------|------|----------|
| `id` | `external_id` | Integer | ✅ |
| `name` | `name` | String | ✅ |
| `parent_id` | `parent_category_id` | Integer | Optional |
| `complete_name` | `path` | String | Optional |
| `image` | `thumbnail` | URL/Base64 | Optional |

### 4.2 Sample Categories Response

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "name_ar": "الإلكترونيات",
      "parent_id": null,
      "image_url": "https://odoo.example.com/categories/electronics.jpg",
      "children": [
        {
          "id": 5,
          "name": "Mobile Phones",
          "name_ar": "الهواتف المحمولة",
          "parent_id": 1
        }
      ]
    }
  ]
}
```

---

## 🏪 5. Brands API Requirements (If Applicable)

| Odoo Field | MedusaJS Field | Type | Required |
|------------|----------------|------|----------|
| `id` | `external_id` | Integer | ✅ |
| `name` | `name` | String | ✅ |
| `logo` | `logo_url` | URL | Optional |
| `description` | `description` | Text | Optional |

---

## 💰 6. Pricing API Requirements

### 6.1 Required Price Fields

| Odoo Field | MedusaJS Field | Type | Required |
|------------|----------------|------|----------|
| `product_id` | `variant_id` | Integer | ✅ |
| `fixed_price` | `amount` | Float | ✅ |
| `currency_id` | `currency_code` | String | ✅ |
| `pricelist_id` | `price_list_id` | Integer | Optional |
| `min_quantity` | `min_quantity` | Integer | Optional |

### 6.2 Sample Price Response

```json
{
  "prices": [
    {
      "product_id": 123,
      "sku": "PHONE-001-256-BLACK",
      "prices": [
        {
          "currency": "AED",
          "amount": 4999.00,
          "pricelist": "Standard",
          "min_quantity": 1
        },
        {
          "currency": "AED",
          "amount": 4799.00,
          "pricelist": "Wholesale",
          "min_quantity": 10
        }
      ]
    }
  ]
}
```

---

## 🛒 7. Orders API (MedusaJS → Odoo)

We will send orders from MedusaJS to Odoo. Your system should accept:

### 7.1 Order Creation Endpoint

```
POST /api/orders/create
```

### 7.2 Order Payload We Will Send

```json
{
  "order": {
    "external_id": "order_01KAARY123",
    "display_id": "MS-10001",
    "customer": {
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Mohammed",
      "phone": "+971501234567"
    },
    "shipping_address": {
      "address_1": "123 Main Street",
      "city": "Dubai",
      "country_code": "AE",
      "postal_code": "00000"
    },
    "items": [
      {
        "sku": "PHONE-001-256-BLACK",
        "product_id": 123,
        "quantity": 2,
        "unit_price": 4999.00,
        "total": 9998.00
      }
    ],
    "subtotal": 9998.00,
    "shipping_total": 50.00,
    "tax_total": 499.90,
    "total": 10547.90,
    "currency_code": "AED",
    "payment_status": "captured",
    "fulfillment_status": "not_fulfilled",
    "created_at": "2025-01-07T10:30:00Z"
  }
}
```

---

## 🔄 8. Webhook/Real-time Sync Requirements

### 8.1 Webhooks We Need from Odoo

| Event | Webhook URL We Provide | Description |
|-------|----------------------|-------------|
| Product Created | `POST /webhooks/odoo/product-created` | When new product is added |
| Product Updated | `POST /webhooks/odoo/product-updated` | When product details change |
| Product Deleted | `POST /webhooks/odoo/product-deleted` | When product is deactivated |
| Inventory Changed | `POST /webhooks/odoo/inventory-updated` | When stock levels change |
| Price Updated | `POST /webhooks/odoo/price-updated` | When prices change |

### 8.2 Alternative: Polling Schedule

If webhooks are not available, we can poll APIs:

| Data Type | Polling Frequency |
|-----------|------------------|
| Products | Every 6 hours |
| Inventory | Every 30 minutes |
| Prices | Every 1 hour |
| Categories | Every 24 hours |

---

## 📝 9. Summary Checklist for Odoo Developer

### APIs to Create/Expose:

- [ ] **Authentication API** - Login and get session token
- [ ] **Products List API** - Get all products with pagination
- [ ] **Product Detail API** - Get single product with variants
- [ ] **Product Updates API** - Get products modified after timestamp
- [ ] **Categories API** - Get all categories hierarchy
- [ ] **Brands API** - Get all brands with logos
- [ ] **Inventory API** - Get stock levels for all products
- [ ] **Price Lists API** - Get prices for different customer groups
- [ ] **Order Create API** - Accept orders from e-commerce
- [ ] **Order Status Update API** - Update order status in Odoo

### Webhooks (If Available):

- [ ] Product created/updated/deleted events
- [ ] Inventory change events
- [ ] Price change events

### Data Requirements:

- [ ] Multi-language support (English + Arabic) for product names/descriptions
- [ ] Product images accessible via URL (not just base64)
- [ ] SKU is unique across all products/variants
- [ ] Categories have complete hierarchy path
- [ ] Inventory per warehouse/location

### Credentials Needed:

- [ ] API endpoint URL
- [ ] Database name
- [ ] API user username
- [ ] API user password or API key
- [ ] Any API documentation

---

## 📞 10. Contact & Handoff

Please provide this document to the Odoo developer and request:

1. **API Documentation** - OpenAPI/Swagger specs if available
2. **Test Environment** - Staging Odoo instance for testing
3. **Test Credentials** - API access to staging environment
4. **Sample Data** - Example API responses from their system
5. **Support Contact** - Developer contact for integration questions

---

## 🔧 Technical Notes

### Our Integration Stack:
- **Integration Layer:** Python 3.10+ with FastAPI
- **Scheduler:** Celery for background sync tasks
- **Queue:** Redis for job queuing
- **E-commerce:** MedusaJS v2.x

### Our Webhook Endpoint Base URL:
```
https://api.marqasouq.com/webhooks/odoo/
```

### Environment We Support:
- Production
- Staging (for testing)

---

**Document prepared for:** Marqa Souq E-Commerce Integration  
**Contact:** [Your Integration Team Email]
