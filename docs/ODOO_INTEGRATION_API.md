# MarqaSouq - Odoo Integration API Documentation

**Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Base URL:** `https://api.marqasouq.com` (Production) | `http://localhost:9000` (Development)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Orders API](#2-orders-api)
3. [Inventory API](#3-inventory-api)
4. [Customers API](#4-customers-api)
5. [Products Sync API](#5-products-sync-api)
6. [Webhooks](#6-webhooks)
7. [Error Handling](#7-error-handling)

---

## 1. Authentication

All Odoo integration APIs require admin authentication.

### Get Admin Token

```
POST /auth/user/emailpass
```

**Request Body:**
```json
{
  "email": "admin@marqasouq.com",
  "password": "your_admin_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Required Headers for All Requests

```http
Content-Type: application/json
Authorization: Bearer {admin_token}
```

---

## 2. Orders API

### 2.1 List All Orders (For Odoo Sync)

```
GET /admin/orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page (default: 50) |
| `offset` | number | Pagination offset |
| `status` | string | Filter: `pending`, `completed`, `canceled` |
| `created_at[gte]` | datetime | Orders after this date |
| `created_at[lte]` | datetime | Orders before this date |

**Example:**
```
GET /admin/orders?status=pending&limit=50&created_at[gte]=2026-01-30T00:00:00Z
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01ABC123",
      "display_id": 1001,
      "status": "pending",
      "fulfillment_status": "not_fulfilled",
      "payment_status": "captured",
      "customer_id": "cus_01XYZ",
      "email": "customer@example.com",
      "currency_code": "KWD",
      "items": [
        {
          "id": "item_01ABC",
          "title": "Liberty Guard Film Cutting Plotter",
          "variant_id": "variant_01KEVBHW79ZAPYP5J6ZFM67RST",
          "sku": "LG-CPFL1625",
          "quantity": 1,
          "unit_price": 150000,
          "subtotal": 150000
        }
      ],
      "shipping_address": {
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "address_1": "Block 5, Street 10, House 25",
        "city": "Kuwait City",
        "country_code": "kw",
        "postal_code": "12345",
        "phone": "+965-12345678"
      },
      "billing_address": {...},
      "subtotal": 150000,
      "tax_total": 0,
      "shipping_total": 1000,
      "discount_total": 0,
      "total": 151000,
      "created_at": "2026-01-30T10:30:00.000Z",
      "updated_at": "2026-01-30T10:30:00.000Z",
      "metadata": {
        "odoo_synced": false,
        "odoo_order_id": null
      }
    }
  ],
  "count": 150,
  "offset": 0,
  "limit": 50
}
```

### 2.2 Get Single Order Details

```
GET /admin/orders/{order_id}
```

**Response:**
```json
{
  "order": {
    "id": "order_01ABC123",
    "display_id": 1001,
    "status": "pending",
    "customer": {
      "id": "cus_01XYZ",
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "phone": "+965-12345678"
    },
    "items": [
      {
        "id": "item_01ABC",
        "title": "Liberty Guard Film Cutting Plotter",
        "variant": {
          "id": "variant_01KEVBHW79ZAPYP5J6ZFM67RST",
          "sku": "LG-CPFL1625",
          "product": {
            "id": "prod_01KEVBHW78T3MQXDHP9ZVVSRCF",
            "title": "Liberty Guard Intelligent Film Cutting Plotter 16-inch-Orange"
          }
        },
        "quantity": 1,
        "unit_price": 150000,
        "subtotal": 150000
      }
    ],
    "shipping_address": {...},
    "shipping_methods": [
      {
        "id": "sm_01ABC",
        "shipping_option": {
          "name": "Standard Delivery"
        },
        "price": 1000
      }
    ],
    "payments": [
      {
        "id": "pay_01ABC",
        "amount": 151000,
        "provider_id": "manual",
        "status": "captured"
      }
    ],
    "subtotal": 150000,
    "tax_total": 0,
    "shipping_total": 1000,
    "total": 151000,
    "created_at": "2026-01-30T10:30:00.000Z"
  }
}
```

### 2.3 Update Order Status (After Odoo Processing)

```
POST /admin/orders/{order_id}
```

**Request Body:**
```json
{
  "metadata": {
    "odoo_synced": true,
    "odoo_order_id": "SO/2026/001234",
    "odoo_sync_date": "2026-01-30T11:00:00.000Z"
  }
}
```

### 2.4 Create Fulfillment (Mark as Shipped)

```
POST /admin/orders/{order_id}/fulfillments
```

**Request Body:**
```json
{
  "items": [
    {
      "item_id": "item_01ABC",
      "quantity": 1
    }
  ],
  "metadata": {
    "tracking_number": "KW123456789",
    "carrier": "DHL"
  }
}
```

### 2.5 Cancel Order

```
POST /admin/orders/{order_id}/cancel
```

**Response:**
```json
{
  "order": {
    "id": "order_01ABC123",
    "status": "canceled",
    "canceled_at": "2026-01-30T12:00:00.000Z"
  }
}
```

---

## 3. Inventory API

### 3.1 List All Inventory Items

```
GET /admin/inventory-items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `sku` | string | Filter by SKU |
| `q` | string | Search by title or SKU |

**Response:**
```json
{
  "inventory_items": [
    {
      "id": "iitem_odoo_71047_1769183500048",
      "sku": "LG-CPFL1625",
      "title": "Liberty Guard Intelligent Film Cutting Plotter 16-inch-Orange",
      "requires_shipping": true,
      "location_levels": [
        {
          "id": "iloc_01ABC",
          "location_id": "sloc_01ABC",
          "stocked_quantity": 2,
          "reserved_quantity": 0,
          "incoming_quantity": 0,
          "available_quantity": 2
        }
      ]
    }
  ],
  "count": 1500
}
```

### 3.2 Get Inventory Item by SKU

```
GET /admin/inventory-items?sku={sku}
```

**Example:**
```
GET /admin/inventory-items?sku=LG-CPFL1625
```

### 3.3 Update Inventory Stock (From Odoo)

```
POST /admin/inventory-items/{inventory_item_id}/location-levels/{location_id}
```

**Request Body:**
```json
{
  "stocked_quantity": 100
}
```

**Response:**
```json
{
  "inventory_level": {
    "id": "iloc_01ABC",
    "inventory_item_id": "iitem_odoo_71047_1769183500048",
    "location_id": "sloc_01ABC",
    "stocked_quantity": 100,
    "reserved_quantity": 0,
    "incoming_quantity": 0
  }
}
```

### 3.4 Batch Update Inventory (Recommended for Odoo Sync)

```
POST /admin/inventory/batch-update
```

**Request Body:**
```json
{
  "updates": [
    {
      "sku": "LG-CPFL1625",
      "stocked_quantity": 2
    },
    {
      "sku": "SLEEVE",
      "stocked_quantity": 605
    },
    {
      "sku": "IPHONE-CASE-001",
      "stocked_quantity": 150
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "results": [
    {
      "sku": "LG-CPFL1625",
      "status": "updated",
      "stocked_quantity": 2
    },
    {
      "sku": "SLEEVE",
      "status": "updated",
      "stocked_quantity": 605
    },
    {
      "sku": "IPHONE-CASE-001",
      "status": "updated",
      "stocked_quantity": 150
    }
  ]
}
```

### 3.5 Reduce Stock (After Order Fulfillment)

```
POST /admin/inventory/reduce-stock
```

**Request Body:**
```json
{
  "sku": "LG-CPFL1625",
  "quantity": 1,
  "order_id": "order_01ABC123",
  "reason": "order_fulfilled"
}
```

**Response:**
```json
{
  "success": true,
  "inventory_item": {
    "sku": "LG-CPFL1625",
    "previous_quantity": 2,
    "reduced_by": 1,
    "new_quantity": 1
  }
}
```

### 3.6 Get Stock Locations

```
GET /admin/stock-locations
```

**Response:**
```json
{
  "stock_locations": [
    {
      "id": "sloc_01ABC",
      "name": "Main Warehouse",
      "address": {
        "city": "Kuwait City",
        "country_code": "kw"
      }
    }
  ]
}
```

---

## 4. Customers API

### 4.1 List All Customers

```
GET /admin/customers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `email` | string | Filter by email |
| `q` | string | Search by name or email |
| `created_at[gte]` | datetime | Customers created after date |

**Example:**
```
GET /admin/customers?limit=50&created_at[gte]=2026-01-01T00:00:00Z
```

**Response:**
```json
{
  "customers": [
    {
      "id": "cus_01XYZ789",
      "email": "ahmed@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "phone": "+965-12345678",
      "has_account": true,
      "orders": [
        {
          "id": "order_01ABC123",
          "display_id": 1001,
          "total": 151000
        }
      ],
      "shipping_addresses": [
        {
          "id": "addr_01ABC",
          "first_name": "Ahmed",
          "last_name": "Al-Rashid",
          "address_1": "Block 5, Street 10, House 25",
          "city": "Kuwait City",
          "country_code": "kw",
          "phone": "+965-12345678"
        }
      ],
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-30T10:30:00.000Z",
      "metadata": {
        "odoo_customer_id": null,
        "odoo_synced": false
      }
    }
  ],
  "count": 250,
  "offset": 0,
  "limit": 50
}
```

### 4.2 Get Single Customer

```
GET /admin/customers/{customer_id}
```

**Response:**
```json
{
  "customer": {
    "id": "cus_01XYZ789",
    "email": "ahmed@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "phone": "+965-12345678",
    "billing_address": {...},
    "shipping_addresses": [...],
    "orders": [...],
    "metadata": {
      "odoo_customer_id": null,
      "preferred_language": "ar"
    },
    "created_at": "2026-01-15T10:00:00.000Z"
  }
}
```

### 4.3 Update Customer (Sync from Odoo)

```
POST /admin/customers/{customer_id}
```

**Request Body:**
```json
{
  "metadata": {
    "odoo_customer_id": "RES.PARTNER/12345",
    "odoo_synced": true,
    "odoo_sync_date": "2026-01-30T11:00:00.000Z"
  }
}
```

### 4.4 Create Customer (From Odoo)

```
POST /admin/customers
```

**Request Body:**
```json
{
  "email": "newcustomer@example.com",
  "first_name": "Mohammed",
  "last_name": "Al-Sabah",
  "phone": "+965-55667788",
  "metadata": {
    "odoo_customer_id": "RES.PARTNER/12346",
    "source": "odoo_import"
  }
}
```

### 4.5 Get New Customers (For Odoo Sync)

```
GET /admin/customers?created_at[gte]={last_sync_date}&metadata[odoo_synced]=false
```

**Example:**
```
GET /admin/customers?created_at[gte]=2026-01-30T00:00:00Z
```

---

## 5. Products Sync API

### 5.1 List All Products

```
GET /admin/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `q` | string | Search query |

**Response:**
```json
{
  "products": [
    {
      "id": "prod_01KEVBHW78T3MQXDHP9ZVVSRCF",
      "title": "Liberty Guard Intelligent Film Cutting Plotter 16-inch-Orange",
      "handle": "liberty-guard-intelligent-film-cutting-plotter-16-inch-orange",
      "status": "published",
      "variants": [
        {
          "id": "variant_01KEVBHW79ZAPYP5J6ZFM67RST",
          "title": "Default",
          "sku": "LG-CPFL1625",
          "barcode": null,
          "prices": [
            {
              "currency_code": "KWD",
              "amount": 150000
            }
          ],
          "inventory_quantity": 2,
          "manage_inventory": true
        }
      ],
      "metadata": {
        "odoo_product_id": "71047",
        "odoo_product_tmpl_id": "71047"
      }
    }
  ],
  "count": 1500
}
```

### 5.2 Update Product Price (From Odoo)

```
POST /admin/products/{product_id}/variants/{variant_id}
```

**Request Body:**
```json
{
  "prices": [
    {
      "currency_code": "KWD",
      "amount": 160000
    }
  ]
}
```

### 5.3 Create Product (From Odoo)

```
POST /admin/products
```

**Request Body:**
```json
{
  "title": "New Product from Odoo",
  "handle": "new-product-from-odoo",
  "status": "published",
  "options": [
    {
      "title": "Default"
    }
  ],
  "variants": [
    {
      "title": "Default",
      "sku": "NEW-SKU-001",
      "prices": [
        {
          "currency_code": "KWD",
          "amount": 25000
        }
      ],
      "manage_inventory": true,
      "inventory_quantity": 100
    }
  ],
  "metadata": {
    "odoo_product_id": "99999",
    "odoo_product_tmpl_id": "99999"
  }
}
```

---

## 6. Webhooks

Configure webhooks to receive real-time notifications when events occur.

### 6.1 Available Webhook Events

| Event | Description |
|-------|-------------|
| `order.placed` | New order created |
| `order.updated` | Order status changed |
| `order.canceled` | Order canceled |
| `order.completed` | Order completed |
| `customer.created` | New customer registered |
| `customer.updated` | Customer profile updated |
| `inventory.updated` | Stock levels changed |

### 6.2 Webhook Payload Format

**Order Placed Webhook:**
```json
{
  "event": "order.placed",
  "timestamp": "2026-01-30T10:30:00.000Z",
  "data": {
    "id": "order_01ABC123",
    "display_id": 1001,
    "email": "customer@example.com",
    "items": [
      {
        "sku": "LG-CPFL1625",
        "quantity": 1,
        "unit_price": 150000
      }
    ],
    "shipping_address": {
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "address_1": "Block 5, Street 10",
      "city": "Kuwait City",
      "country_code": "kw",
      "phone": "+965-12345678"
    },
    "total": 151000,
    "currency_code": "KWD"
  }
}
```

**Customer Created Webhook:**
```json
{
  "event": "customer.created",
  "timestamp": "2026-01-30T10:00:00.000Z",
  "data": {
    "id": "cus_01XYZ789",
    "email": "newcustomer@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "phone": "+965-12345678"
  }
}
```

### 6.3 Configure Webhook URL

Contact admin to configure webhook URL for your Odoo instance:
- **Webhook URL:** `https://your-odoo-instance.com/api/medusa/webhook`
- **Secret Key:** Will be provided for signature verification

---

## 7. Error Handling

### Error Response Format

```json
{
  "type": "error_type",
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| HTTP Status | Type | Description |
|-------------|------|-------------|
| 400 | `invalid_data` | Invalid request body |
| 401 | `unauthorized` | Invalid or missing token |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Duplicate resource |
| 500 | `server_error` | Internal error |

---

## Quick Reference - Odoo Sync Flow

### 1. Sync New Orders to Odoo

```
1. GET /admin/orders?status=pending&metadata[odoo_synced]=false
2. Process each order in Odoo
3. POST /admin/orders/{order_id} with odoo_order_id
4. POST /admin/inventory/reduce-stock for each item
```

### 2. Sync Stock from Odoo

```
1. POST /admin/inventory/batch-update with all SKU quantities
```

### 3. Sync New Customers to Odoo

```
1. GET /admin/customers?metadata[odoo_synced]=false
2. Create customer in Odoo
3. POST /admin/customers/{customer_id} with odoo_customer_id
```

### 4. Update Order Fulfillment

```
1. POST /admin/orders/{order_id}/fulfillments with tracking info
```

---

## Python Code Example for Odoo

```python
import requests
from datetime import datetime

class MedusaAPI:
    def __init__(self, base_url, admin_email, admin_password):
        self.base_url = base_url
        self.token = self._get_token(admin_email, admin_password)
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
    
    def _get_token(self, email, password):
        response = requests.post(
            f'{self.base_url}/auth/user/emailpass',
            json={'email': email, 'password': password}
        )
        return response.json().get('token')
    
    def get_pending_orders(self):
        """Get all pending orders not synced to Odoo"""
        response = requests.get(
            f'{self.base_url}/admin/orders',
            headers=self.headers,
            params={'status': 'pending', 'limit': 100}
        )
        return response.json().get('orders', [])
    
    def mark_order_synced(self, order_id, odoo_order_id):
        """Mark order as synced to Odoo"""
        response = requests.post(
            f'{self.base_url}/admin/orders/{order_id}',
            headers=self.headers,
            json={
                'metadata': {
                    'odoo_synced': True,
                    'odoo_order_id': odoo_order_id,
                    'odoo_sync_date': datetime.now().isoformat()
                }
            }
        )
        return response.json()
    
    def update_inventory(self, updates):
        """Batch update inventory from Odoo"""
        response = requests.post(
            f'{self.base_url}/admin/inventory/batch-update',
            headers=self.headers,
            json={'updates': updates}
        )
        return response.json()
    
    def reduce_stock(self, sku, quantity, order_id):
        """Reduce stock after order fulfillment"""
        response = requests.post(
            f'{self.base_url}/admin/inventory/reduce-stock',
            headers=self.headers,
            json={
                'sku': sku,
                'quantity': quantity,
                'order_id': order_id,
                'reason': 'order_fulfilled'
            }
        )
        return response.json()
    
    def get_new_customers(self, since_date):
        """Get customers created after a specific date"""
        response = requests.get(
            f'{self.base_url}/admin/customers',
            headers=self.headers,
            params={
                'created_at[gte]': since_date,
                'limit': 100
            }
        )
        return response.json().get('customers', [])
    
    def mark_customer_synced(self, customer_id, odoo_partner_id):
        """Mark customer as synced to Odoo"""
        response = requests.post(
            f'{self.base_url}/admin/customers/{customer_id}',
            headers=self.headers,
            json={
                'metadata': {
                    'odoo_synced': True,
                    'odoo_customer_id': odoo_partner_id,
                    'odoo_sync_date': datetime.now().isoformat()
                }
            }
        )
        return response.json()


# Usage Example
api = MedusaAPI(
    base_url='http://localhost:9000',
    admin_email='admin@marqasouq.com',
    admin_password='admin_password'
)

# Get pending orders
orders = api.get_pending_orders()
for order in orders:
    print(f"Order #{order['display_id']}: {order['total']} KWD")
    
    # Process in Odoo and get Odoo order ID
    odoo_order_id = "SO/2026/001234"  # From Odoo
    
    # Mark as synced
    api.mark_order_synced(order['id'], odoo_order_id)
    
    # Reduce stock for each item
    for item in order['items']:
        api.reduce_stock(item['sku'], item['quantity'], order['id'])

# Sync inventory from Odoo
inventory_updates = [
    {'sku': 'LG-CPFL1625', 'stocked_quantity': 2},
    {'sku': 'SLEEVE', 'stocked_quantity': 605},
]
api.update_inventory(inventory_updates)

# Sync new customers
new_customers = api.get_new_customers('2026-01-30T00:00:00Z')
for customer in new_customers:
    print(f"New customer: {customer['email']}")
    # Create in Odoo and get partner ID
    odoo_partner_id = "RES.PARTNER/12345"  # From Odoo
    api.mark_customer_synced(customer['id'], odoo_partner_id)
```

---

## Contact

**API Base URL (Production):** `https://api.marqasouq.com`  
**API Base URL (Development):** `http://localhost:9000`

For webhook configuration or API access, contact the development team.

---

## 8. Dedicated Odoo API Endpoints

The following custom endpoints have been created specifically for Odoo integration:

### 8.1 Get Orders for Odoo

```
GET /odoo/orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Comma-separated: `pending,completed,canceled` |
| `date_from` | datetime | Orders created after this date |
| `date_to` | datetime | Orders created before this date |
| `limit` | number | Items per page (default: 50) |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01ABC123",
      "display_id": 1001,
      "status": "pending",
      "email": "customer@example.com",
      "currency_code": "KWD",
      "created_at": "2026-01-30T10:30:00.000Z",
      "customer": {
        "id": "cus_01XYZ",
        "email": "customer@example.com",
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "phone": "+965-12345678"
      },
      "shipping_address": {
        "first_name": "Ahmed",
        "last_name": "Al-Rashid",
        "address_1": "Block 5, Street 10",
        "city": "Kuwait City",
        "country_code": "kw",
        "phone": "+965-12345678"
      },
      "items": [
        {
          "id": "item_01ABC",
          "title": "Liberty Guard Film Cutting Plotter",
          "quantity": 1,
          "unit_price": 150000,
          "sku": "LG-CPFL1625",
          "variant_title": "Orange"
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### 8.2 Get Single Order for Odoo

```
GET /odoo/orders/{order_id}
```

Returns detailed order information including:
- Customer details
- Shipping & billing addresses
- Line items with SKU, barcode, weight
- Payment information
- Fulfillment status

### 8.3 Update Order from Odoo

```
PATCH /odoo/orders/{order_id}
```

**Request Body:**
```json
{
  "status": "completed",
  "odoo_order_id": "SO/2026/001234",
  "odoo_status": "invoiced",
  "metadata": {
    "odoo_invoice_id": "INV/2026/001234"
  }
}
```

### 8.4 Get Customers for Odoo

```
GET /odoo/customers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `created_after` | datetime | Customers created after this date |
| `email` | string | Filter by email |
| `phone` | string | Filter by phone |
| `limit` | number | Items per page (default: 50) |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "customers": [
    {
      "id": "cus_01XYZ",
      "email": "customer@example.com",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "phone": "+965-12345678",
      "has_account": true,
      "created_at": "2026-01-15T08:00:00.000Z",
      "addresses": [
        {
          "address_1": "Block 5, Street 10",
          "city": "Kuwait City",
          "country_code": "kw",
          "is_default_shipping": true
        }
      ],
      "stats": {
        "order_count": 5,
        "total_spent": 75500
      }
    }
  ],
  "pagination": {...}
}
```

### 8.5 Get Inventory for Odoo

```
GET /odoo/inventory
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sku` | string | Filter by SKU (partial match) |
| `low_stock` | boolean | Only return items with stock < 10 |
| `include_products` | boolean | Include product details |
| `limit` | number | Items per page (default: 100) |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "inventory": [
    {
      "id": "iitem_01ABC",
      "sku": "LG-CPFL1625",
      "title": "Liberty Guard Intelligent Film Cutting Plotter",
      "stocked_quantity": 2,
      "reserved_quantity": 0,
      "available_quantity": 2,
      "location_name": "Default Warehouse",
      "product": {
        "variant_id": "variant_01ABC",
        "product_id": "prod_01ABC",
        "product_title": "Liberty Guard Film Cutting Plotter"
      }
    }
  ],
  "pagination": {...}
}
```

### 8.6 Batch Sync Inventory from Odoo

```
POST /odoo/inventory
```

**Request Body:**
```json
{
  "items": [
    {"sku": "LG-CPFL1625", "quantity": 10, "title": "Liberty Guard Plotter"},
    {"sku": "SLEEVE", "quantity": 1000, "title": "Finger Gaming Sleeve"},
    {"sku": "NEW-ITEM", "quantity": 50, "title": "New Product from Odoo"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 3,
    "synced": 3,
    "failed": 0
  },
  "results": [
    {"sku": "LG-CPFL1625", "status": "synced", "previous_quantity": 2, "new_quantity": 10},
    {"sku": "SLEEVE", "status": "synced", "previous_quantity": 605, "new_quantity": 1000},
    {"sku": "NEW-ITEM", "status": "synced", "previous_quantity": 0, "new_quantity": 50}
  ]
}
```

### 8.7 Batch Update Inventory (Admin)

```
POST /admin/inventory/batch-update
```

**Request Body:**
```json
{
  "updates": [
    {"sku": "LG-CPFL1625", "stocked_quantity": 10},
    {"sku": "SLEEVE", "stocked_quantity": 1000}
  ]
}
```

### 8.8 Reduce Stock After Order Fulfillment

```
POST /admin/inventory/reduce-stock
```

**Request Body:**
```json
{
  "order_id": "order_01ABC123",
  "reason": "order_shipped",
  "items": [
    {"sku": "LG-CPFL1625", "quantity": 1},
    {"sku": "SLEEVE", "quantity": 2}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order_01ABC123",
  "reason": "order_shipped",
  "summary": {
    "total_items": 2,
    "successful": 2,
    "failed": 0,
    "insufficient_stock": 0
  },
  "results": [
    {"sku": "LG-CPFL1625", "status": "reduced", "previous_quantity": 2, "new_quantity": 1, "reduced_by": 1},
    {"sku": "SLEEVE", "status": "reduced", "previous_quantity": 605, "new_quantity": 603, "reduced_by": 2}
  ]
}
```

---

## Python Integration Example (Updated)

```python
import requests
from datetime import datetime

class OdooMedusaAPI:
    def __init__(self, base_url, admin_email, admin_password):
        self.base_url = base_url
        self.session = requests.Session()
        self._authenticate(admin_email, admin_password)
    
    def _authenticate(self, email, password):
        response = self.session.post(
            f'{self.base_url}/auth/user/emailpass',
            json={'email': email, 'password': password}
        )
        token = response.json()['token']
        self.session.headers['Authorization'] = f'Bearer {token}'
    
    # ===== ORDERS =====
    def get_orders(self, status=None, date_from=None, limit=50, offset=0):
        """Get orders using dedicated Odoo endpoint"""
        params = {'limit': limit, 'offset': offset}
        if status:
            params['status'] = status
        if date_from:
            params['date_from'] = date_from
        response = self.session.get(f'{self.base_url}/odoo/orders', params=params)
        return response.json()
    
    def get_order_detail(self, order_id):
        """Get detailed order information"""
        response = self.session.get(f'{self.base_url}/odoo/orders/{order_id}')
        return response.json()
    
    def update_order_status(self, order_id, odoo_order_id, odoo_status):
        """Update order with Odoo information"""
        response = self.session.patch(
            f'{self.base_url}/odoo/orders/{order_id}',
            json={
                'odoo_order_id': odoo_order_id,
                'odoo_status': odoo_status
            }
        )
        return response.json()
    
    # ===== INVENTORY =====
    def get_inventory(self, low_stock_only=False, include_products=True):
        """Get current inventory levels"""
        params = {
            'low_stock': 'true' if low_stock_only else 'false',
            'include_products': 'true' if include_products else 'false',
            'limit': 500
        }
        response = self.session.get(f'{self.base_url}/odoo/inventory', params=params)
        return response.json()
    
    def sync_inventory(self, items):
        """
        Batch sync inventory from Odoo.
        items: list of dicts with 'sku', 'quantity', optional 'title'
        """
        response = self.session.post(
            f'{self.base_url}/odoo/inventory',
            json={'items': items}
        )
        return response.json()
    
    def reduce_stock(self, order_id, items):
        """
        Reduce stock after order fulfillment.
        items: list of dicts with 'sku' and 'quantity'
        """
        response = self.session.post(
            f'{self.base_url}/admin/inventory/reduce-stock',
            json={
                'order_id': order_id,
                'reason': 'order_shipped',
                'items': items
            }
        )
        return response.json()
    
    # ===== CUSTOMERS =====
    def get_customers(self, created_after=None, limit=50):
        """Get customers for Odoo CRM sync"""
        params = {'limit': limit}
        if created_after:
            params['created_after'] = created_after
        response = self.session.get(f'{self.base_url}/odoo/customers', params=params)
        return response.json()


# ===== USAGE EXAMPLE =====
if __name__ == '__main__':
    api = OdooMedusaAPI(
        base_url='http://localhost:9000',
        admin_email='admin@marqasouq.com',
        admin_password='your_password'
    )
    
    # 1. Get pending orders to process
    print("=== Fetching pending orders ===")
    orders_response = api.get_orders(status='pending,completed')
    for order in orders_response['orders']:
        print(f"Order #{order['display_id']}: {order['status']}")
        
        # Create order in Odoo (your Odoo logic here)
        odoo_order_id = f"SO/{datetime.now().year}/{order['display_id']:06d}"
        
        # Mark as synced in Medusa
        api.update_order_status(order['id'], odoo_order_id, 'synced')
    
    # 2. Reduce stock when order ships
    print("\n=== Reducing stock for shipped order ===")
    stock_items = [
        {'sku': 'LG-CPFL1625', 'quantity': 1},
        {'sku': 'SLEEVE', 'quantity': 2}
    ]
    result = api.reduce_stock('order_01ABC123', stock_items)
    print(f"Stock reduction result: {result['summary']}")
    
    # 3. Sync inventory from Odoo
    print("\n=== Syncing inventory from Odoo ===")
    inventory_updates = [
        {'sku': 'LG-CPFL1625', 'quantity': 10, 'title': 'Liberty Guard Plotter'},
        {'sku': 'SLEEVE', 'quantity': 1000, 'title': 'Gaming Finger Sleeve'},
    ]
    sync_result = api.sync_inventory(inventory_updates)
    print(f"Sync result: {sync_result['summary']}")
    
    # 4. Get low stock items for reorder
    print("\n=== Low stock items ===")
    inventory = api.get_inventory(low_stock_only=True)
    for item in inventory['inventory']:
        print(f"  {item['sku']}: {item['stocked_quantity']} (reorder needed)")
    
    # 5. Sync new customers to Odoo CRM
    print("\n=== New customers ===")
    customers = api.get_customers(created_after='2026-01-01T00:00:00Z')
    for customer in customers['customers']:
        print(f"  {customer['email']} - Orders: {customer['stats']['order_count']}")
```

