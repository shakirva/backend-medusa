# MarqaSouq - Odoo Integration API Documentation

## 🔗 For Odoo Developer Integration

**Base URL (Production):** `https://admin.markasouqs.com`  
**Base URL (Development):** `http://localhost:9000`  
**Last Updated:** February 28, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Webhooks from MedusaJS to Odoo](#3-webhooks-from-medusajs-to-odoo)
4. [API Endpoints for Odoo](#4-api-endpoints-for-odoo)
5. [Product Sync from Odoo to MedusaJS](#5-product-sync-from-odoo-to-medusajs)
6. [Inventory Sync](#6-inventory-sync)
7. [Data Models & Field Mapping](#7-data-models--field-mapping)
8. [Implementation Examples](#8-implementation-examples)
9. [Error Handling](#9-error-handling)

---

## 1. Overview

### Integration Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Mobile App    │────────►│   MedusaJS      │◄───────►│     Odoo        │
│   (Flutter)     │         │   Backend       │         │     ERP         │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                                    │ Webhooks/Events
                                    ▼
                            ┌─────────────────┐
                            │   Odoo System   │
                            │   (Your Server) │
                            └─────────────────┘
```

### What MedusaJS Sends to Odoo:
- **New Orders** → Create Sale Order in Odoo + Reduce Inventory
- **New Customers** → Create/Update Partner in Odoo
- **Order Status Updates** → Sync fulfillment status

### What Odoo Sends to MedusaJS:
- **Product Details** → Create/Update products with full details
- **Inventory Updates** → Real-time stock quantity sync
- **Product Images** → Image URLs for product gallery
- **Categories** → Product categorization

---

## 2. Authentication

### API Key Authentication

All Odoo integration endpoints require an API key header:

```
x-odoo-api-key: YOUR_ODOO_API_KEY
```

**Current API Key:** Contact the MedusaJS admin to get the API key.

### Generate API Key

```bash
# On MedusaJS server
cd /var/www/marqa-souq/backend/backend-medusa
npx medusa exec src/scripts/generate-odoo-api-key.ts
```

---

## 3. Webhooks from MedusaJS to Odoo

### 3.1 Order Created Webhook

When a new order is placed in MedusaJS, we automatically:
1. Create a Sale Order in Odoo
2. Match products by SKU (`default_code` in Odoo)
3. Reduce inventory when order is confirmed

**Odoo Webhook URL (Configure in MedusaJS):**
```
ODOO_WEBHOOK_URL=https://your-odoo-server.com/api/medusa/order-created
```

**Payload sent to Odoo:**
```json
{
  "event": "order.created",
  "timestamp": "2026-02-28T10:30:00.000Z",
  "data": {
    "order": {
      "id": "order_01ABC123",
      "display_id": 1001,
      "status": "pending",
      "email": "customer@example.com",
      "currency_code": "kwd",
      "subtotal": 15000,
      "tax_total": 0,
      "shipping_total": 1000,
      "total": 16000,
      "created_at": "2026-02-28T10:30:00.000Z",
      "customer": {
        "id": "cus_01ABC",
        "email": "customer@example.com",
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "phone": "+965-12345678"
      },
      "shipping_address": {
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "address_1": "Block 5, Street 10, House 25",
        "city": "Kuwait City",
        "country_code": "kw",
        "postal_code": "12345",
        "phone": "+965-12345678"
      },
      "items": [
        {
          "id": "li_01ABC",
          "title": "iPhone 15 Pro Case",
          "quantity": 2,
          "unit_price": 5000,
          "subtotal": 10000,
          "sku": "CASE-IP15PRO-001",
          "variant_id": "variant_01ABC",
          "product_id": "prod_01ABC"
        },
        {
          "id": "li_02DEF",
          "title": "Power Bank 20000mAh",
          "quantity": 1,
          "unit_price": 5000,
          "subtotal": 5000,
          "sku": "PB-20000-BLK",
          "variant_id": "variant_02DEF",
          "product_id": "prod_02DEF"
        }
      ]
    }
  }
}
```

### 3.2 Customer Created Webhook

**Payload:**
```json
{
  "event": "customer.created",
  "timestamp": "2026-02-28T10:30:00.000Z",
  "data": {
    "customer": {
      "id": "cus_01ABC123",
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "phone": "+965-12345678",
      "has_account": true,
      "created_at": "2026-02-28T10:30:00.000Z",
      "addresses": [
        {
          "address_1": "Block 5, Street 10",
          "city": "Kuwait City",
          "country_code": "kw",
          "phone": "+965-12345678"
        }
      ]
    }
  }
}
```

### 3.3 Order Status Updated Webhook

**Payload:**
```json
{
  "event": "order.status_updated",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "data": {
    "order_id": "order_01ABC123",
    "display_id": 1001,
    "old_status": "pending",
    "new_status": "completed",
    "fulfillment_status": "fulfilled",
    "payment_status": "captured"
  }
}
```

---

## 4. API Endpoints for Odoo

### 4.1 Get Orders (For Odoo to Pull)

```
GET https://admin.markasouqs.com/odoo/orders
```

**Headers:**
```
x-odoo-api-key: YOUR_API_KEY
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `completed`, `cancelled` |
| `date_from` | string | ISO date (e.g., `2026-02-01T00:00:00Z`) |
| `date_to` | string | ISO date |
| `limit` | number | Items per page (default: 50) |
| `offset` | number | Pagination offset |
| `synced` | boolean | Filter by sync status |

**Example:**
```bash
curl -X GET "https://admin.markasouqs.com/odoo/orders?status=pending&date_from=2026-02-01T00:00:00Z&limit=20" \
  -H "x-odoo-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01ABC123",
      "display_id": 1001,
      "status": "pending",
      "email": "customer@example.com",
      "currency_code": "kwd",
      "created_at": "2026-02-28T10:30:00.000Z",
      "customer": {
        "id": "cus_01ABC",
        "email": "customer@example.com",
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "phone": "+965-12345678"
      },
      "shipping_address": {...},
      "items": [
        {
          "id": "li_01ABC",
          "title": "iPhone 15 Pro Case",
          "quantity": 2,
          "unit_price": 5000,
          "sku": "CASE-IP15PRO-001",
          "variant_id": "variant_01ABC"
        }
      ],
      "subtotal": 15000,
      "tax_total": 0,
      "shipping_total": 1000,
      "total": 16000
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### 4.2 Get Single Order

```
GET https://admin.markasouqs.com/odoo/orders/{order_id}
```

### 4.3 Mark Order as Synced

```
POST https://admin.markasouqs.com/odoo/orders/{order_id}/synced
```

**Request Body:**
```json
{
  "odoo_order_id": 12345,
  "synced_at": "2026-02-28T10:35:00.000Z"
}
```

---

### 4.4 Get Customers (For Odoo to Pull)

```
GET https://admin.markasouqs.com/odoo/customers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `created_after` | string | ISO date - Get customers created after this date |
| `email` | string | Search by email |
| `phone` | string | Search by phone |
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "customers": [
    {
      "id": "cus_01ABC123",
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "phone": "+965-12345678",
      "has_account": true,
      "created_at": "2026-02-28T10:30:00.000Z",
      "addresses": [
        {
          "id": "addr_01ABC",
          "address_1": "Block 5, Street 10",
          "city": "Kuwait City",
          "country_code": "kw",
          "phone": "+965-12345678",
          "is_default_shipping": true
        }
      ],
      "order_count": 5,
      "total_spent": 75000
    }
  ],
  "total": 500,
  "limit": 50,
  "offset": 0
}
```

---

### 4.5 Get Inventory (For Odoo to Pull)

```
GET https://admin.markasouqs.com/odoo/inventory
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sku` | string | Filter by SKU |
| `low_stock` | boolean | Only items with stock < 10 |
| `include_products` | boolean | Include product details |
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "inventory": [
    {
      "id": "inv_01ABC",
      "sku": "CASE-IP15PRO-001",
      "title": "iPhone 15 Pro Case",
      "stocked_quantity": 150,
      "reserved_quantity": 5,
      "available_quantity": 145,
      "location_id": "loc_01ABC",
      "location_name": "Main Warehouse",
      "product": {
        "id": "prod_01ABC",
        "title": "iPhone 15 Pro Case",
        "handle": "iphone-15-pro-case",
        "variant_id": "variant_01ABC"
      }
    }
  ],
  "total": 1500,
  "limit": 100,
  "offset": 0
}
```

---

## 5. Product Sync from Odoo to MedusaJS

### 5.1 Create/Update Product

```
POST https://admin.markasouqs.com/odoo/products
```

**Request Body:**
```json
{
  "odoo_product_id": 12345,
  "sku": "CASE-IP15PRO-001",
  "title": "iPhone 15 Pro Case - Black",
  "title_ar": "غطاء آيفون 15 برو - أسود",
  "description": "Premium quality silicone case...",
  "description_ar": "غطاء سيليكون عالي الجودة...",
  "price": 5000,
  "compare_at_price": 7000,
  "cost_price": 2500,
  "currency_code": "kwd",
  "weight": 50,
  "weight_unit": "g",
  "barcode": "6291234567890",
  "category_handle": "mobile-accessories",
  "brand": "Powerology",
  "images": [
    {
      "url": "https://your-odoo.com/web/image/product.product/12345/image_1920",
      "position": 0,
      "is_thumbnail": true
    },
    {
      "url": "https://your-odoo.com/web/image/product.product/12345/image_2",
      "position": 1
    }
  ],
  "metadata": {
    "odoo_id": 12345,
    "warranty_months": 12,
    "origin_country": "China",
    "material": "Silicone",
    "color": "Black"
  },
  "inventory": {
    "quantity": 150,
    "manage_inventory": true,
    "allow_backorder": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "prod_01ABC123",
    "title": "iPhone 15 Pro Case - Black",
    "handle": "iphone-15-pro-case-black",
    "variant_id": "variant_01ABC",
    "sku": "CASE-IP15PRO-001",
    "created": false,
    "updated": true
  }
}
```

### 5.2 Bulk Product Sync

```
POST https://admin.markasouqs.com/odoo/products/bulk
```

**Request Body:**
```json
{
  "products": [
    {
      "odoo_product_id": 12345,
      "sku": "CASE-IP15PRO-001",
      "title": "iPhone 15 Pro Case",
      "price": 5000,
      ...
    },
    {
      "odoo_product_id": 12346,
      "sku": "PB-20000-BLK",
      "title": "Power Bank 20000mAh",
      "price": 8000,
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "total": 2,
    "created": 0,
    "updated": 2,
    "failed": 0,
    "errors": []
  }
}
```

### 5.3 Delete Product

```
DELETE https://admin.markasouqs.com/odoo/products/{sku}
```

---

## 6. Inventory Sync

### 6.1 Update Inventory (Single SKU)

```
POST https://admin.markasouqs.com/odoo/inventory/update
```

**Request Body:**
```json
{
  "sku": "CASE-IP15PRO-001",
  "quantity": 150,
  "location_id": "loc_01ABC"
}
```

### 6.2 Bulk Inventory Update

```
POST https://admin.markasouqs.com/odoo/inventory/bulk-update
```

**Request Body:**
```json
{
  "items": [
    {
      "sku": "CASE-IP15PRO-001",
      "quantity": 150
    },
    {
      "sku": "PB-20000-BLK",
      "quantity": 75
    },
    {
      "sku": "CABLE-USB-C",
      "quantity": 500
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "total": 3,
    "updated": 3,
    "not_found": 0,
    "errors": []
  }
}
```

### 6.3 Reduce Stock (After Order Fulfilled in Odoo)

```
POST https://admin.markasouqs.com/odoo/inventory/reduce
```

**Request Body:**
```json
{
  "order_id": "order_01ABC123",
  "items": [
    {
      "sku": "CASE-IP15PRO-001",
      "quantity": 2
    },
    {
      "sku": "PB-20000-BLK",
      "quantity": 1
    }
  ]
}
```

---

## 7. Data Models & Field Mapping

### Product Field Mapping

| Odoo Field | MedusaJS Field | Notes |
|------------|----------------|-------|
| `id` | `metadata.odoo_id` | Odoo product ID |
| `default_code` | `sku` | **REQUIRED** - Used for matching |
| `name` | `title` | Product title |
| `name_ar` (custom) | `metadata.title_ar` | Arabic title |
| `description` | `description` | Product description |
| `list_price` | `variants[0].prices[0].amount` | Price in fils (×1000) |
| `standard_price` | `metadata.cost_price` | Cost price |
| `barcode` | `variants[0].barcode` | Barcode/EAN |
| `weight` | `variants[0].weight` | Weight in grams |
| `categ_id` | `categories[0]` | Category ID |
| `image_1920` | `thumbnail` | Main image |
| `qty_available` | `inventory_quantity` | Stock quantity |

### Order Field Mapping

| MedusaJS Field | Odoo Field | Notes |
|----------------|------------|-------|
| `id` | `x_medusa_order_id` (custom) | MedusaJS order ID |
| `display_id` | `client_order_ref` | Order reference |
| `customer.email` | `partner_id.email` | Customer email |
| `customer.phone` | `partner_id.phone` | Customer phone |
| `shipping_address` | `partner_shipping_id` | Shipping address |
| `items[].sku` | `order_line.product_id.default_code` | Match by SKU |
| `items[].quantity` | `order_line.product_uom_qty` | Quantity |
| `items[].unit_price` | `order_line.price_unit` | Unit price (÷1000) |
| `total` | `amount_total` | Order total (÷1000) |

### Customer Field Mapping

| MedusaJS Field | Odoo Field | Notes |
|----------------|------------|-------|
| `id` | `x_medusa_customer_id` (custom) | MedusaJS customer ID |
| `email` | `email` | Customer email |
| `first_name` | `name` (part 1) | First name |
| `last_name` | `name` (part 2) | Last name |
| `phone` | `phone` / `mobile` | Phone number |
| `addresses[0].address_1` | `street` | Street address |
| `addresses[0].city` | `city` | City |
| `addresses[0].country_code` | `country_id` | Country |

---

## 8. Implementation Examples

### 8.1 Odoo Python: Receive Order Webhook

```python
# In your Odoo module controller

from odoo import http
from odoo.http import request
import json

class MedusaWebhookController(http.Controller):
    
    @http.route('/api/medusa/order-created', type='json', auth='none', csrf=False)
    def order_created_webhook(self, **kwargs):
        data = json.loads(request.httprequest.data)
        
        if data.get('event') != 'order.created':
            return {'success': False, 'error': 'Invalid event'}
        
        order_data = data['data']['order']
        
        # Find or create customer
        partner = self._find_or_create_partner(order_data)
        
        # Create sale order
        sale_order = self._create_sale_order(order_data, partner)
        
        return {
            'success': True,
            'odoo_order_id': sale_order.id,
            'odoo_order_name': sale_order.name
        }
    
    def _find_or_create_partner(self, order_data):
        Partner = request.env['res.partner'].sudo()
        
        email = order_data.get('email')
        partner = Partner.search([('email', '=', email)], limit=1)
        
        if not partner:
            customer = order_data.get('customer', {})
            shipping = order_data.get('shipping_address', {})
            
            partner = Partner.create({
                'name': f"{shipping.get('first_name', '')} {shipping.get('last_name', '')}".strip(),
                'email': email,
                'phone': shipping.get('phone'),
                'street': shipping.get('address_1'),
                'city': shipping.get('city'),
                'country_id': self._get_country_id(shipping.get('country_code')),
                'x_medusa_customer_id': customer.get('id')
            })
        
        return partner
    
    def _create_sale_order(self, order_data, partner):
        SaleOrder = request.env['sale.order'].sudo()
        Product = request.env['product.product'].sudo()
        
        order_lines = []
        for item in order_data.get('items', []):
            product = Product.search([('default_code', '=', item.get('sku'))], limit=1)
            
            if product:
                order_lines.append((0, 0, {
                    'product_id': product.id,
                    'product_uom_qty': item.get('quantity'),
                    'price_unit': item.get('unit_price') / 1000,  # Convert from fils
                }))
        
        sale_order = SaleOrder.create({
            'partner_id': partner.id,
            'client_order_ref': f"MEDUSA-{order_data.get('display_id')}",
            'x_medusa_order_id': order_data.get('id'),
            'order_line': order_lines,
        })
        
        # Auto-confirm to reduce stock
        sale_order.action_confirm()
        
        return sale_order
    
    def _get_country_id(self, country_code):
        Country = request.env['res.country'].sudo()
        country = Country.search([('code', '=ilike', country_code)], limit=1)
        return country.id if country else False
```

### 8.2 Odoo Python: Push Products to MedusaJS

```python
import requests
import base64

class MedusaProductSync:
    def __init__(self):
        self.base_url = 'https://admin.markasouqs.com'
        self.api_key = 'YOUR_ODOO_API_KEY'
    
    def sync_product(self, product):
        """Sync a single product to MedusaJS"""
        
        # Get product image as URL
        image_url = f"{self.env['ir.config_parameter'].get_param('web.base.url')}/web/image/product.product/{product.id}/image_1920"
        
        payload = {
            'odoo_product_id': product.id,
            'sku': product.default_code,
            'title': product.name,
            'description': product.description_sale or '',
            'price': int(product.list_price * 1000),  # Convert to fils
            'compare_at_price': int(product.lst_price * 1000) if product.lst_price > product.list_price else None,
            'cost_price': int(product.standard_price * 1000),
            'currency_code': 'kwd',
            'weight': product.weight * 1000 if product.weight else 0,  # Convert to grams
            'barcode': product.barcode,
            'category_handle': product.categ_id.name.lower().replace(' ', '-') if product.categ_id else None,
            'brand': product.x_brand or None,
            'images': [
                {
                    'url': image_url,
                    'position': 0,
                    'is_thumbnail': True
                }
            ],
            'metadata': {
                'odoo_id': product.id,
                'warranty_months': product.x_warranty_months or 0,
                'origin_country': product.country_id.name if product.country_id else None,
            },
            'inventory': {
                'quantity': int(product.qty_available),
                'manage_inventory': True,
                'allow_backorder': False
            }
        }
        
        response = requests.post(
            f'{self.base_url}/odoo/products',
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'x-odoo-api-key': self.api_key
            }
        )
        
        return response.json()
    
    def bulk_sync_inventory(self, products):
        """Bulk sync inventory levels"""
        
        items = [{
            'sku': p.default_code,
            'quantity': int(p.qty_available)
        } for p in products if p.default_code]
        
        response = requests.post(
            f'{self.base_url}/odoo/inventory/bulk-update',
            json={'items': items},
            headers={
                'Content-Type': 'application/json',
                'x-odoo-api-key': self.api_key
            }
        )
        
        return response.json()
```

### 8.3 Scheduled Inventory Sync (Odoo Cron)

```xml
<!-- In your Odoo module data/cron.xml -->
<odoo>
    <record id="cron_medusa_inventory_sync" model="ir.cron">
        <field name="name">MedusaJS Inventory Sync</field>
        <field name="model_id" ref="model_product_product"/>
        <field name="state">code</field>
        <field name="code">model.sync_inventory_to_medusa()</field>
        <field name="interval_number">15</field>
        <field name="interval_type">minutes</field>
        <field name="numbercall">-1</field>
        <field name="active">True</field>
    </record>
</odoo>
```

---

## 9. Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `NOT_FOUND` | 404 | Resource not found (product, order, etc.) |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SKU_NOT_FOUND` | 404 | Product with SKU not found |
| `DUPLICATE_SKU` | 409 | SKU already exists |
| `INVENTORY_ERROR` | 500 | Failed to update inventory |
| `SYNC_FAILED` | 500 | Sync operation failed |

### Retry Logic

For failed webhook deliveries, MedusaJS will:
1. Retry after 1 minute
2. Retry after 5 minutes
3. Retry after 15 minutes
4. Mark as failed (manual intervention required)

---

## 10. Environment Variables

Add these to your MedusaJS `.env` file:

```env
# Odoo Integration
ODOO_URL=https://your-odoo-server.com
ODOO_DB_NAME=your_database
ODOO_USERNAME=api_user
ODOO_PASSWORD=api_password
ODOO_API_KEY=generated_api_key_for_odoo

# Webhook URL (where MedusaJS sends events to Odoo)
ODOO_WEBHOOK_URL=https://your-odoo-server.com/api/medusa/webhooks
ODOO_WEBHOOK_SECRET=webhook_secret_key
```

---

## 11. Testing Endpoints

### Test with cURL

```bash
# Test authentication
curl -X GET "https://admin.markasouqs.com/odoo/orders?limit=1" \
  -H "x-odoo-api-key: YOUR_API_KEY"

# Test inventory update
curl -X POST "https://admin.markasouqs.com/odoo/inventory/update" \
  -H "Content-Type: application/json" \
  -H "x-odoo-api-key: YOUR_API_KEY" \
  -d '{"sku": "TEST-SKU-001", "quantity": 100}'

# Test product create
curl -X POST "https://admin.markasouqs.com/odoo/products" \
  -H "Content-Type: application/json" \
  -H "x-odoo-api-key: YOUR_API_KEY" \
  -d '{
    "odoo_product_id": 99999,
    "sku": "TEST-PROD-001",
    "title": "Test Product",
    "price": 5000,
    "currency_code": "kwd",
    "inventory": {"quantity": 50, "manage_inventory": true}
  }'
```

---

## 12. Quick Reference

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/odoo/orders` | Get orders for Odoo |
| GET | `/odoo/orders/{id}` | Get single order |
| POST | `/odoo/orders/{id}/synced` | Mark order as synced |
| GET | `/odoo/customers` | Get customers |
| GET | `/odoo/inventory` | Get inventory levels |
| POST | `/odoo/inventory/update` | Update single SKU stock |
| POST | `/odoo/inventory/bulk-update` | Bulk inventory update |
| POST | `/odoo/inventory/reduce` | Reduce stock after fulfillment |
| POST | `/odoo/products` | Create/update product |
| POST | `/odoo/products/bulk` | Bulk product sync |
| DELETE | `/odoo/products/{sku}` | Delete product |

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `order.created` | New order placed | Full order with items |
| `order.status_updated` | Order status changed | Status change details |
| `customer.created` | New customer registered | Customer details |
| `customer.updated` | Customer profile updated | Updated fields |

---

---

## 13. Webhooks from Odoo TO MedusaJS (Push Data)

These are webhook endpoints that Odoo can call to push data INTO MedusaJS.

### 13.1 Product Webhook (Odoo → Medusa)

**Endpoint:**
```
POST https://admin.markasouqs.com/odoo/webhooks/products
```

**When to Call:**
- A new product is created in Odoo
- A product is updated in Odoo
- A product is archived/deleted in Odoo

**Request Headers:**
```
Content-Type: application/json
x-odoo-api-key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "event_type": "product.created",
  "product": {
    "odoo_id": 123,
    "sku": "PHONE-CASE-001",
    "name": "iPhone 15 Pro Case",
    "description": "Premium leather case for iPhone 15 Pro",
    "list_price": 25.00,
    "standard_price": 12.00,
    "barcode": "1234567890123",
    "weight": 0.15,
    "category_name": "Phone Cases",
    "active": true,
    "qty_available": 100
  }
}
```

**Supported Event Types:**
| Event Type | Description |
|------------|-------------|
| `product.created` | New product created in Odoo |
| `product.updated` | Product details updated |
| `product.deleted` | Product archived/deleted |

**Response (Success):**
```json
{
  "success": true,
  "action": "updated",
  "product": {
    "variant_id": "variant_01ABC",
    "product_id": "prod_01ABC",
    "sku": "PHONE-CASE-001"
  }
}
```

**Response (Product Not in Catalog):**
```json
{
  "success": true,
  "action": "inventory_created",
  "message": "Product not found in catalog, inventory item created for future linking",
  "sku": "PHONE-CASE-001"
}
```

---

### 13.2 Inventory Webhook (Odoo → Medusa)

**Endpoint:**
```
POST https://admin.markasouqs.com/odoo/webhooks/inventory
```

**When to Call:**
- Stock is received in Odoo warehouse
- Stock adjustment is made
- Products are manufactured
- Inter-warehouse transfer happens

**Request Body:**
```json
{
  "event_type": "inventory.updated",
  "items": [
    {
      "sku": "PHONE-CASE-001",
      "odoo_product_id": 123,
      "quantity": 50,
      "adjustment_type": "absolute",
      "warehouse_name": "Main Warehouse",
      "reason": "Stock received from supplier"
    },
    {
      "sku": "PHONE-CASE-002",
      "quantity": -5,
      "adjustment_type": "delta",
      "reason": "Manual adjustment - damaged items"
    }
  ]
}
```

**Supported Event Types:**
| Event Type | Description |
|------------|-------------|
| `inventory.updated` | Stock quantity changed |
| `inventory.adjustment` | Manual adjustment made |
| `stock.received` | New stock received |
| `stock.transfer` | Inter-warehouse transfer |

**Adjustment Types:**
| Type | Description |
|------|-------------|
| `absolute` | Replace current quantity with new value |
| `delta` | Add/subtract from current quantity (use negative for reduction) |

**Response:**
```json
{
  "success": true,
  "event_type": "inventory.updated",
  "summary": {
    "total": 2,
    "processed": 2,
    "failed": 0,
    "not_found": 0
  },
  "results": [
    {
      "sku": "PHONE-CASE-001",
      "status": "success",
      "previous_quantity": 25,
      "new_quantity": 50
    },
    {
      "sku": "PHONE-CASE-002",
      "status": "success",
      "previous_quantity": 30,
      "new_quantity": 25
    }
  ]
}
```

---

### 13.3 Order Status Webhook (Odoo → Medusa)

**Endpoint:**
```
POST https://admin.markasouqs.com/odoo/webhooks/order-status
```

**When to Call:**
- Order is confirmed in Odoo
- Order is shipped/delivered
- Order is cancelled
- Invoice is created
- Payment is received

**Request Body (Order Shipped):**
```json
{
  "event_type": "order.shipped",
  "order": {
    "medusa_order_id": "order_01HXY123ABC456",
    "odoo_order_id": 123,
    "odoo_order_name": "S00123",
    "tracking_number": "TRK123456789",
    "tracking_url": "https://tracking.carrier.com/TRK123456789",
    "carrier_name": "FedEx",
    "shipped_date": "2026-02-28T10:30:00Z"
  }
}
```

**Request Body (Order Delivered):**
```json
{
  "event_type": "order.delivered",
  "order": {
    "medusa_order_id": "order_01HXY123ABC456",
    "delivered_date": "2026-03-01T14:00:00Z"
  }
}
```

**Request Body (Order Cancelled):**
```json
{
  "event_type": "order.cancelled",
  "order": {
    "medusa_order_id": "order_01HXY123ABC456",
    "cancelled_reason": "Customer requested cancellation"
  }
}
```

**Supported Event Types:**
| Event Type | Description |
|------------|-------------|
| `order.confirmed` | Order confirmed in Odoo |
| `order.shipped` | Order shipped with tracking |
| `order.delivered` | Order delivered to customer |
| `order.cancelled` | Order cancelled |
| `order.invoiced` | Invoice created |
| `order.paid` | Payment received |

**Response:**
```json
{
  "success": true,
  "event_type": "order.shipped",
  "order": {
    "medusa_order_id": "order_01HXY123ABC456",
    "display_id": 1001,
    "odoo_order_id": 123,
    "odoo_order_name": "S00123"
  },
  "metadata_updated": ["odoo_shipped", "odoo_shipped_at", "tracking_number", "tracking_url", "carrier_name"]
}
```

---

## 14. Odoo Python Integration Examples

### 14.1 Send Product Update to Medusa

```python
import requests
import json

MEDUSA_BASE_URL = "https://admin.markasouqs.com"
MEDUSA_API_KEY = "your_odoo_api_key"

def sync_product_to_medusa(product):
    """
    Call this from Odoo when a product is created/updated
    """
    url = f"{MEDUSA_BASE_URL}/odoo/webhooks/products"
    
    payload = {
        "event_type": "product.updated",
        "product": {
            "odoo_id": product.id,
            "sku": product.default_code,  # SKU in Odoo
            "name": product.name,
            "description": product.description_sale or "",
            "list_price": product.list_price,
            "standard_price": product.standard_price,
            "barcode": product.barcode or "",
            "weight": product.weight,
            "category_name": product.categ_id.name if product.categ_id else "",
            "active": product.active,
            "qty_available": product.qty_available,
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-odoo-api-key": MEDUSA_API_KEY
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### 14.2 Send Inventory Update to Medusa

```python
def sync_inventory_to_medusa(products):
    """
    Call this when stock changes in Odoo
    products: list of product.product records
    """
    url = f"{MEDUSA_BASE_URL}/odoo/webhooks/inventory"
    
    items = []
    for product in products:
        if product.default_code:  # Only sync products with SKU
            items.append({
                "sku": product.default_code,
                "odoo_product_id": product.id,
                "quantity": product.qty_available,
                "adjustment_type": "absolute",
                "warehouse_name": "Main Warehouse"
            })
    
    if not items:
        return {"error": "No products with SKU found"}
    
    payload = {
        "event_type": "inventory.updated",
        "items": items
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-odoo-api-key": MEDUSA_API_KEY
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### 14.3 Update Order Status in Medusa

```python
def update_order_status_in_medusa(sale_order, event_type, **kwargs):
    """
    Call this when order status changes in Odoo
    event_type: 'order.confirmed', 'order.shipped', 'order.delivered', 'order.cancelled'
    """
    url = f"{MEDUSA_BASE_URL}/odoo/webhooks/order-status"
    
    # Get Medusa order ID from sale order metadata
    medusa_order_id = sale_order.x_medusa_order_id  # Custom field in Odoo
    
    payload = {
        "event_type": event_type,
        "order": {
            "medusa_order_id": medusa_order_id,
            "odoo_order_id": sale_order.id,
            "odoo_order_name": sale_order.name,
            **kwargs  # tracking_number, tracking_url, etc.
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-odoo-api-key": MEDUSA_API_KEY
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Usage Examples:

# When order is shipped:
update_order_status_in_medusa(
    sale_order,
    "order.shipped",
    tracking_number="TRK123456789",
    tracking_url="https://tracking.carrier.com/TRK123456789",
    carrier_name="FedEx"
)

# When order is delivered:
update_order_status_in_medusa(sale_order, "order.delivered")

# When order is cancelled:
update_order_status_in_medusa(
    sale_order,
    "order.cancelled",
    cancelled_reason="Customer requested cancellation"
)
```

### 14.4 Odoo Automated Actions (Server Actions)

Create these as automated actions in Odoo:

**Product Update Trigger:**
```python
# Model: product.template
# Trigger: On Write (Update)

for record in records:
    for product in record.product_variant_ids:
        sync_product_to_medusa(product)
```

**Inventory Change Trigger:**
```python
# Model: stock.quant
# Trigger: On Write (Update)

products_to_sync = []
for record in records:
    if record.product_id.default_code:
        products_to_sync.append(record.product_id)

if products_to_sync:
    sync_inventory_to_medusa(products_to_sync)
```

**Sale Order Status Trigger:**
```python
# Model: sale.order
# Trigger: On Write (Update)
# Domain: [('state', 'in', ['sale', 'done', 'cancel'])]

for record in records:
    if record.state == 'sale':
        update_order_status_in_medusa(record, "order.confirmed")
    elif record.state == 'done':
        # Check delivery status
        if all(picking.state == 'done' for picking in record.picking_ids):
            update_order_status_in_medusa(record, "order.delivered")
    elif record.state == 'cancel':
        update_order_status_in_medusa(
            record,
            "order.cancelled",
            cancelled_reason=record.note or "Cancelled"
        )
```

---

## Contact

For integration questions:
- **Technical Support:** Contact MedusaJS development team
- **API Access:** Request API keys from admin

**Production Base URL:** `https://admin.markasouqs.com`  
**Admin Dashboard:** `https://admin.markasouqs.com/app`
