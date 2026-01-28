# Marqa Souq - API Documentation for Odoo Developer

## Overview

This document provides the API endpoints needed for integrating Odoo with the Marqa Souq e-commerce platform powered by MedusaJS. The Odoo developer can use these APIs to:
1. Fetch real customer data
2. Fetch real order data
3. Sync inventory from Odoo to Medusa

## Base URL

- **Development**: `http://localhost:9000`
- **Production**: `https://api.markasouq.com` (TBD)

## Authentication

### Admin API Authentication (for backend operations)

For admin operations, you need to authenticate first and use the session cookie/token.

```bash
# Get admin token (one-time setup)
curl -X POST http://localhost:9000/admin/session \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@markasouq.com", "password": "admin123"}'
```

Response includes authentication cookie for subsequent requests.

---

## Customer APIs

### 1. List All Customers

```bash
GET /admin/customers
```

**Headers:**
- `Cookie: connect.sid=<session_cookie>` (from admin login)

**Query Parameters:**
- `limit` (optional): Number of customers per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `email` (optional): Filter by email

**Example:**
```bash
curl "http://localhost:9000/admin/customers?limit=50&offset=0" \
  -H "Cookie: connect.sid=<session>"
```

**Response:**
```json
{
  "customers": [
    {
      "id": "cus_01KFYZNTFQ4AGNEVR15206N3GN",
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+965-12345678",
      "created_at": "2025-01-28T10:00:00.000Z",
      "updated_at": "2025-01-28T10:00:00.000Z",
      "metadata": {
        "odoo_partner_id": 123
      }
    }
  ],
  "count": 100,
  "offset": 0,
  "limit": 50
}
```

### 2. Get Single Customer

```bash
GET /admin/customers/:customer_id
```

**Example:**
```bash
curl "http://localhost:9000/admin/customers/cus_01KFYZNTFQ4AGNEVR15206N3GN" \
  -H "Cookie: connect.sid=<session>"
```

### 3. Update Customer with Odoo ID

To link a Medusa customer with an Odoo partner:

```bash
POST /admin/customers/:customer_id
```

**Body:**
```json
{
  "metadata": {
    "odoo_partner_id": 12345
  }
}
```

---

## Order APIs

### 1. List All Orders

```bash
GET /admin/orders
```

**Headers:**
- `Cookie: connect.sid=<session_cookie>`

**Query Parameters:**
- `limit` (optional): Number of orders per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (pending, completed, cancelled)
- `payment_status` (optional): Filter by payment status
- `fulfillment_status` (optional): Filter by fulfillment status

**Example:**
```bash
curl "http://localhost:9000/admin/orders?limit=50&offset=0" \
  -H "Cookie: connect.sid=<session>"
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01KFYZNTFQ4AGNEVR15206N3GN",
      "display_id": 1001,
      "email": "customer@example.com",
      "currency_code": "kwd",
      "status": "pending",
      "payment_status": "captured",
      "fulfillment_status": "not_fulfilled",
      "total": 25500,
      "subtotal": 25000,
      "shipping_total": 0,
      "tax_total": 500,
      "created_at": "2025-01-28T10:00:00.000Z",
      "customer": {
        "id": "cus_01KFYZNTFQ4AGNEVR15206N3GN",
        "email": "customer@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "items": [
        {
          "id": "item_01KFYZNTFQ4AGNEVR15206N3GN",
          "title": "Porodo 6 AC USB Hub",
          "quantity": 1,
          "unit_price": 25000,
          "total": 25000,
          "variant": {
            "id": "variant_01KFYZNTFQ4AGNEVR15206N3GN",
            "sku": "PRD-001",
            "product_id": "prod_01KFYZNTFQ4AGNEVR15206N3GN"
          }
        }
      ],
      "shipping_address": {
        "first_name": "John",
        "last_name": "Doe",
        "address_1": "Block 5, Street 10",
        "address_2": "Building 15, Apt 3",
        "city": "Kuwait City",
        "country_code": "kw",
        "phone": "+965-12345678"
      },
      "metadata": {
        "odoo_order_id": null
      }
    }
  ],
  "count": 100,
  "offset": 0,
  "limit": 50
}
```

### 2. Get Single Order

```bash
GET /admin/orders/:order_id
```

**Example:**
```bash
curl "http://localhost:9000/admin/orders/order_01KFYZNTFQ4AGNEVR15206N3GN" \
  -H "Cookie: connect.sid=<session>"
```

### 3. Update Order with Odoo Order ID

After creating the order in Odoo, update Medusa with the Odoo reference:

```bash
POST /admin/orders/:order_id
```

**Body:**
```json
{
  "metadata": {
    "odoo_order_id": 12345,
    "odoo_sync_status": "synced",
    "odoo_synced_at": "2025-01-28T10:00:00.000Z"
  }
}
```

---

## Product APIs (for Inventory Sync)

### 1. List Products with Inventory

```bash
GET /admin/products
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 50)
- `offset` (optional): Pagination offset
- `expand` (optional): Include related data, e.g., `variants,variants.inventory_items`

**Example:**
```bash
curl "http://localhost:9000/admin/products?limit=100&expand=variants" \
  -H "Cookie: connect.sid=<session>"
```

### 2. Update Product Inventory

To update inventory levels from Odoo:

```bash
POST /admin/inventory-items/:inventory_item_id/location-levels/:location_id
```

**Body:**
```json
{
  "stocked_quantity": 150
}
```

---

## Webhook Endpoints (Optional)

You can configure webhooks to receive real-time notifications when orders are placed.

### Order Created Webhook

Register a webhook URL in Medusa admin, and it will send:

```json
{
  "event": "order.created",
  "data": {
    "id": "order_01KFYZNTFQ4AGNEVR15206N3GN",
    "display_id": 1001,
    "email": "customer@example.com",
    "items": [...],
    "shipping_address": {...}
  }
}
```

---

## Current Automatic Sync (Already Implemented)

### Order to Odoo Sync

We have already implemented an automatic order sync that:
1. Triggers when an order is placed in Medusa
2. Authenticates with Odoo using the configured credentials
3. Creates a Sales Order in Odoo with:
   - Partner (creates if not exists)
   - Order Lines (matches products by SKU/default_code)
   - Auto-confirms the order to reduce stock

**Location:** `backend/my-medusa-store/src/subscribers/order-to-odoo.ts`

### Inventory Sync from Odoo

We have a scheduled job that:
1. Runs every 15 minutes
2. Fetches `qty_available` from Odoo for all products
3. Updates inventory levels in Medusa

**Location:** `backend/my-medusa-store/src/jobs/odoo-inventory-sync-job.ts`

---

## Important Notes

### Currency

- All amounts are in **fils** (1000 fils = 1 KWD)
- Divide by 1000 to get KWD value
- Example: `25500` = 25.500 KWD

### SKU Matching

Products are matched between Medusa and Odoo using:
- Medusa: `variant.sku` or `product.metadata.sku`
- Odoo: `product.product.default_code`

Ensure all products in Odoo have a unique `default_code` set.

### Required Odoo API Access

The integration requires:
1. JSON-RPC access to Odoo (`/jsonrpc` endpoint)
2. User with permissions to:
   - Read `product.product`
   - Create/Confirm `sale.order`
   - Read/Create `res.partner`

### Current Odoo Credentials (Development)

```
URL: https://oskarllc-new-27289548.dev.odoo.com
Database: oskarllc-new-27289548
Username: SYG
Password: S123456
```

**⚠️ These must be updated for production!**

---

## Questions for Odoo Developer

1. What is the production Odoo URL?
2. What are the production API credentials?
3. Should we create Odoo partners automatically, or will they be pre-created?
4. Do you want order status updates synced back to Medusa?
5. What fields should be included in the order sync?
6. Are there any custom Odoo fields needed for the integration?

---

## Contact

For API questions or issues, contact the development team.
