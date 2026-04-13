# 📋 Odoo ↔ Marqa Souq Webhook Checklist
**For Odoo Developer Integration Reference**  
**Production Server:** `https://admin.markasouqs.com`  
**Date:** March 23, 2026  

> ℹ️ **Note:** Order status notifications (shipped/delivered/cancelled) are handled automatically by the Marqa Souq admin dashboard — **no order-status webhook is needed from Odoo.**

---

## 🔐 Authentication

All incoming webhooks from Odoo **MUST** include the secret in the request body:

```json
{
  "webhook_secret": "marqa-odoo-webhook-2026",
  "event_type": "...",
  ...
}
```

> ⚠️ Wrong or missing `webhook_secret` returns **HTTP 401 Unauthorized**

---

## ✅ WEBHOOK 1 — Product Sync (Odoo → Marqa)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST https://admin.markasouqs.com/odoo/webhooks/products` |
| **Direction** | Odoo → Marqa Souq |
| **Status** | ✅ **LIVE & WORKING** |
| **Auth** | `webhook_secret` in body |
| **Test URL** | `GET https://admin.markasouqs.com/odoo/webhooks/products` |

### Supported Events

| Event | When to Fire | Status |
|-------|-------------|--------|
| `product.created` | New product published in Odoo | ✅ Working |
| `product.updated` | Product price/title/image changed | ✅ Working |
| `product.deleted` | Product archived/deleted in Odoo | ✅ Working |
| `product.bulk` | Sync multiple products at once | ✅ Working |

### Payload — Single Product (`product.created` / `product.updated`)

```json
{
  "event_type": "product.created",
  "webhook_secret": "marqa-odoo-webhook-2026",
  "product": {
    "odoo_id": 123,
    "name": "Porodo 65W GaN Charger",
    "default_code": "PDK-CHG-65W",
    "list_price": 89.00,
    "compare_list_price": 120.00,
    "currency_code": "aed",
    "description_sale": "Product description here",
    "categ_id": [15, "Mobile / Cables & Chargers"],
    "brand": "Porodo",
    "image_url": "https://your-odoo.com/web/image/product.product/123/image_1920",
    "is_published": true,
    "qty_available": 50,
    "barcode": "1234567890123",x`
    "night_delivery": true,
    "fast_delivery_areas": ["Kuwait City", "Hawalli", "Salmiya", "Rumaithiya"]
  }
}
```

### Payload — Bulk Products (`product.bulk`)

```json
{
  "event_type": "product.bulk",
  "webhook_secret": "marqa-odoo-webhook-2026",
  "products": [
    {
      "odoo_id": 123,
      "name": "Product 1",
      "default_code": "SKU-001",
      "list_price": 89.00,
      "currency_code": "aed",
      "categ_id": [15, "Mobile / Cables & Chargers"],
      "brand": "Porodo",
      "image_url": "https://...",
      "is_published": true,
      "qty_available": 50
    },
    {
      "odoo_id": 124,
      "name": "Product 2",
      "default_code": "SKU-002",
      "list_price": 49.00,
      "currency_code": "aed",
      "categ_id": [20, "Computer / Webcam"],
      "brand": "Baseus",
      "image_url": "https://...",
      "is_published": true,
      "qty_available": 25
    }
  ]
}
```

### Payload — Delete (`product.deleted`)

```json
{
  "event_type": "product.deleted",
  "webhook_secret": "marqa-odoo-webhook-2026",
  "product": {
    "odoo_id": 123
  }
}
```

### What Marqa Does on Receive
- ✅ Creates or updates product in database
- ✅ Sets price in AED (or specified currency)
- ✅ Auto-creates category if it doesn't exist
- ✅ Links product to category
- ✅ Sets thumbnail from `image_url`
- ✅ Updates inventory stock quantity
- ✅ Sets status: `published` or `draft` based on `is_published`
- ✅ Sets **Night Delivery eligibility** from `night_delivery` (true/false)
- ✅ Sets **Fast Delivery areas** from `fast_delivery_areas` (array of area names)

> 📦 **Delivery fields explained:**
> - `night_delivery: true` → product page shows "Night Delivery" option (KWD 2.000)
> - `fast_delivery_areas: ["Kuwait City", "Hawalli"]` → product page shows "Fast Delivery · 1-2 days" with area chips
> - If both are `false`/empty → only Standard Delivery is shown

---

## ✅ WEBHOOK 2 — Inventory Sync (Odoo → Marqa)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST https://admin.markasouqs.com/odoo/webhooks/inventory` |
| **Direction** | Odoo → Marqa Souq |
| **Status** | ✅ **LIVE & WORKING** |
| **Auth** | None (open endpoint) |
| **Test URL** | `GET https://admin.markasouqs.com/odoo/webhooks/inventory` |

### Supported Events

| Event | When to Fire | Status |
|-------|-------------|--------|
| `inventory.updated` | Stock quantity changed in Odoo | ✅ Working |
| `inventory.adjustment` | Manual stock adjustment | ✅ Working |
| `stock.received` | New stock received from supplier | ✅ Working |
| `stock.transfer` | Stock transferred between locations | ✅ Working |

### Payload

```json
{
  "event_type": "inventory.updated",
  "items": [
    {
      "sku": "PDK-CHG-65W",
      "odoo_product_id": 123,
      "quantity": 50,
      "adjustment_type": "absolute",
      "warehouse_name": "Main Warehouse",
      "reason": "Stock received from supplier"
    },
    {
      "sku": "BSS-CAB-001",
      "odoo_product_id": 124,
      "quantity": -5,
      "adjustment_type": "delta",
      "reason": "Manual adjustment"
    }
  ]
}
```

**`adjustment_type` values:**
- `"absolute"` → Set stock to exact number (e.g., `quantity: 50` = 50 units in stock)
- `"delta"` → Add/subtract from current stock (e.g., `quantity: -5` = subtract 5)

### What Marqa Does on Receive
- ✅ Finds product by SKU
- ✅ Updates `stocked_quantity` in inventory
- ✅ Supports both absolute and delta adjustments
- ✅ Logs event_type for tracking

---

## ~~WEBHOOK 3 — Order Status~~ ❌ NOT NEEDED

> Order status notifications are handled **automatically by the Marqa Souq admin dashboard**.  
> When admin ships/delivers/cancels an order from the dashboard, customers are notified automatically via email + push notification.  
> **Odoo does NOT need to call any order-status webhook.**

---

## 📤 API 3 — Orders Pull (Marqa → Odoo)

| Field | Value |
|-------|-------|
| **Endpoint** | `GET https://admin.markasouqs.com/odoo/orders` |
| **Direction** | Odoo pulls from Marqa |
| **Status** | ✅ **LIVE & WORKING** |
| **Auth** | API Key in header |

### Usage
Odoo can call this to fetch new/pending orders:

```
GET https://admin.markasouqs.com/odoo/orders?status=pending&limit=50
GET https://admin.markasouqs.com/odoo/orders?since=2026-03-23T00:00:00Z
```

### Response Format
```json
{
  "orders": [
    {
      "id": "order_01HXY123ABC456",
      "status": "pending",
      "customer": {
        "id": "cust_123",
        "email": "customer@example.com",
        "first_name": "Mohammed",
        "last_name": "Al-Rashid",
        "phone": "+971501234567"
      },
      "items": [
        {
          "product_id": "prod_123",
          "sku": "PDK-CHG-65W",
          "title": "Porodo 65W GaN Charger",
          "quantity": 2,
          "unit_price": 89.00,
          "total": 178.00,
          "currency": "aed"
        }
      ],
      "shipping_address": {
        "first_name": "Mohammed",
        "last_name": "Al-Rashid",
        "address_1": "Villa 12, Street 5",
        "city": "Dubai",
        "country_code": "ae",
        "phone": "+971501234567"
      },
      "subtotal": 178.00,
      "total": 195.00,
      "currency": "aed",
      "created_at": "2026-03-23T09:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 📤 API 4 — Customers Pull (Marqa → Odoo)

| Field | Value |
|-------|-------|
| **Endpoint** | `GET https://admin.markasouqs.com/odoo/customers` |
| **Direction** | Odoo pulls from Marqa |
| **Status** | ✅ **LIVE & WORKING** |
| **Auth** | API Key in header |

### Usage
```
GET https://admin.markasouqs.com/odoo/customers?limit=100&offset=0
```

---

## 📋 Summary Table for Odoo Developer

| # | Webhook/API | Endpoint | Direction | Status | Auth Required |
|---|-------------|----------|-----------|--------|---------------|
| 1 | Product Sync | `POST /odoo/webhooks/products` | Odoo → Marqa | ✅ **LIVE** | `webhook_secret` in body |
| 2 | Inventory Sync | `POST /odoo/webhooks/inventory` | Odoo → Marqa | ✅ **LIVE** | None |
| 3 | Orders Pull | `GET /odoo/orders` | Marqa → Odoo | ✅ **LIVE** | API Key |
| 4 | Customers Pull | `GET /odoo/customers` | Marqa → Odoo | ✅ **LIVE** | API Key |

**Total: 4 endpoints — ALL LIVE ✅**

> ❌ ~~Order Status Webhook~~ — Not needed. Order notifications are handled by the Marqa admin dashboard automatically.

---

## 🧪 Quick Test Commands

Test Webhook 1 (Products) with valid secret:
```bash
curl -X POST https://admin.markasouqs.com/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "product.created",
    "webhook_secret": "marqa-odoo-webhook-2026",
    "product": {
      "odoo_id": 999,
      "name": "Test Product",
      "default_code": "TEST-001",
      "list_price": 50.00,
      "currency_code": "aed",
      "is_published": true
    }
  }'
```

Test Webhook 2 (Inventory):
```bash
curl -X POST https://admin.markasouqs.com/odoo/webhooks/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "inventory.updated",
    "items": [{"sku": "TEST-001", "quantity": 100, "adjustment_type": "absolute"}]
  }'
```

---

## ⚠️ Important Notes for Odoo Developer

1. **Product `categ_id` format**: Send as Odoo's standard `[id, "path/string"]` format
   - Example: `[15, "Mobile / Mobile Accessories / Cases"]`
   - Marqa auto-creates categories if they don't exist

2. **Currency**: Always send `"aed"` unless product has different pricing

3. **Image URL**: Use Odoo's direct image URL format:
   - `https://your-odoo.com/web/image/product.product/{id}/image_1920`

4. **Order identification**: Always send `medusa_order_id` when available — it's the most reliable identifier

5. **Webhook secret**: Only Webhook 1 (Products) requires the secret. Webhooks 2 and 3 are open.

6. **Rate limiting**: No rate limit currently, but recommend max 100 products per bulk call

---

*Generated: March 23, 2026*  
*Server: admin.markasouqs.com (72.61.240.40)*  
*All 4 endpoints verified LIVE ✅*
