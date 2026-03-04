
## 📍 API Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://admin.markasouqs.com` |
| **Development** | `http://localhost:9000` |

---

## 🔑 Authentication

All API calls require this header:
```
Content-Type: application/json
```

No API key required for now (we'll add it later if needed).

---

## 📤 Webhooks to Call FROM Odoo TO MedusaJS

### 1️⃣ Product Sync (When product is created/updated in Odoo)

**Endpoint:** `POST https://admin.markasouqs.com/odoo/webhooks/products`

**When to Call:**
- Product created in Odoo
- Product updated in Odoo
- Product deleted/archived in Odoo

**Request Body:**
```json
{
  "event_type": "product.updated",
  "product": {
    "odoo_id": 123,
    "sku": "PHONE-CASE-001",
    "name": "iPhone 15 Pro Case",
    "description": "Premium leather case",
    "list_price": 25.00,
    "barcode": "1234567890123",
    "weight": 0.15,
    "category_name": "Phone Cases",
    "active": true,
    "qty_available": 100
  }
}
```

**Event Types:** `product.created`, `product.updated`, `product.deleted`

---

### 2️⃣ Inventory Sync (When stock changes in Odoo)

**Endpoint:** `POST https://admin.markasouqs.com/odoo/webhooks/inventory`

**When to Call:**
- Stock received from supplier
- Stock adjustment made
- Inter-warehouse transfer

**Request Body:**
```json
{
  "event_type": "inventory.updated",
  "items": [
    {
      "sku": "PHONE-CASE-001",
      "quantity": 50,
      "adjustment_type": "absolute"
    },
    {
      "sku": "PHONE-CASE-002",
      "quantity": -5,
      "adjustment_type": "delta"
    }
  ]
}
```

**Adjustment Types:**
- `absolute` = Replace current quantity with new value
- `delta` = Add/subtract from current quantity (use negative for reduction)

---

### 3️⃣ Order Status Update (When order ships/delivers in Odoo)

**Endpoint:** `POST https://admin.markasouqs.com/odoo/webhooks/order-status`

**When to Call:**
- Order confirmed
- Order shipped (with tracking)
- Order delivered
- Order cancelled

**Request Body (Shipped):**
```json
{
  "event_type": "order.shipped",
  "order": {
    "medusa_order_id": "order_01ABC123",
    "odoo_order_name": "S00123",
    "tracking_number": "TRK123456789",
    "tracking_url": "https://tracking.carrier.com/TRK123456789",
    "carrier_name": "FedEx"
  }
}
```

**Event Types:** `order.confirmed`, `order.shipped`, `order.delivered`, `order.cancelled`

---

## 📥 APIs to Pull Data FROM MedusaJS

### Get Orders (Pull new orders to Odoo)

**Endpoint:** `GET https://admin.markasouqs.com/odoo/orders`

**Query Parameters:**
- `status=pending` - Filter by status
- `limit=50` - Items per page
- `offset=0` - Pagination offset

**Example:**
```bash
curl "https://admin.markasouqs.com/odoo/orders?status=pending&limit=20"
```

---

### Get Customers (Pull customers to Odoo)

**Endpoint:** `GET https://admin.markasouqs.com/odoo/customers`

**Example:**
```bash
curl "https://admin.markasouqs.com/odoo/customers?limit=50"
```

---

### Get Inventory (Pull current stock levels)

**Endpoint:** `GET https://admin.markasouqs.com/odoo/inventory`

**Query Parameters:**
- `sku=PHONE` - Filter by SKU
- `low_stock=true` - Only low stock items

**Example:**
```bash
curl "https://admin.markasouqs.com/odoo/inventory?low_stock=true"
```

---

## 🔄 How Integration Works

```
┌─────────────────┐                      ┌─────────────────┐
│                 │    New Orders        │                 │
│    MedusaJS     │─────────────────────►│      Odoo       │
│   (E-commerce)  │                      │     (ERP)       │
│                 │◄─────────────────────│                 │
└─────────────────┘   Inventory/Status   └─────────────────┘
```

1. **Customer places order** → MedusaJS creates order
2. **MedusaJS sends order to Odoo** → Odoo creates Sale Order (automatic)
3. **Odoo confirms order** → Stock reduced in Odoo
4. **Odoo ships order** → Call `/odoo/webhooks/order-status` with tracking
5. **Stock changes in Odoo** → Call `/odoo/webhooks/inventory` to sync

---

## 📋 Important Notes

1. **SKU Matching:** Products are matched by SKU (`default_code` in Odoo)
2. **Currency:** All prices in KWD (fils = 1/1000 KWD)
3. **Automatic Order Sync:** Orders from MedusaJS are automatically sent to Odoo when placed
4. **Test First:** Use development URL first before production

---

## 🧪 Test Commands

```bash
# Test product webhook
curl -X POST "https://admin.markasouqs.com/odoo/webhooks/products" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"product.updated","product":{"sku":"TEST-001","name":"Test Product","qty_available":10}}'

# Test inventory webhook
curl -X POST "https://admin.markasouqs.com/odoo/webhooks/inventory" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"inventory.updated","items":[{"sku":"TEST-001","quantity":50,"adjustment_type":"absolute"}]}'

# Test get orders
curl "https://admin.markasouqs.com/odoo/orders?limit=5"
```

---

