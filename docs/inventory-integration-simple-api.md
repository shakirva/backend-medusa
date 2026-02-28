# Odoo Inventory Integration - Quick Implementation Guide

## Overview

This document provides a quick reference for implementing Odoo inventory synchronization with MedusaJS.

---

## Integration Architecture

```
Odoo ERP                    Integration Layer              MedusaJS
┌──────────┐               ┌────────────────┐            ┌──────────┐
│ Products │──────────────▶│  Python/Node   │───────────▶│ Products │
│ Inventory│◀──────────────│  Sync Service  │◀───────────│ Orders   │
│ Prices   │               └────────────────┘            └──────────┘
└──────────┘                       │
                                   │
                            ┌──────▼──────┐
                            │   Redis     │
                            │   Queue     │
                            └─────────────┘
```

---

## Required Odoo API Endpoints

### 1. Products Sync (Odoo → Medusa)

```python
# Fetch products from Odoo
GET /api/products
GET /api/products?updated_after=2025-01-01T00:00:00Z
```

### 2. Inventory Sync (Odoo → Medusa)

```python
# Fetch inventory levels
GET /api/inventory
GET /api/inventory?sku=PRODUCT-SKU
```

### 3. Orders Sync (Medusa → Odoo)

```python
# Send orders to Odoo
POST /api/orders/create
POST /api/orders/{id}/update-status
```

---

## Environment Variables Required

```env
# Odoo Configuration
ODOO_URL=https://odoo.client.com
ODOO_DB=database_name
ODOO_USERNAME=api_user
ODOO_PASSWORD=api_password

# MedusaJS Configuration
MEDUSA_URL=http://localhost:9000
MEDUSA_ADMIN_API_KEY=your_admin_api_key
```

---

## Sync Schedule

| Data Type | Direction | Frequency |
|-----------|-----------|-----------|
| Products | Odoo → Medusa | Every 6 hours |
| Inventory | Odoo → Medusa | Every 30 minutes |
| Prices | Odoo → Medusa | Every 1 hour |
| Orders | Medusa → Odoo | Real-time (on order) |

---

## Key Files

- `/odoo-integration/odoo_connector.py` - Main integration connector
- `/docs/ODOO_INTEGRATION_REQUIREMENTS.md` - Full requirements doc for Odoo developer

---

## Next Steps

1. Get API credentials from Odoo developer
2. Set up test environment
3. Configure environment variables
4. Run test sync
5. Enable scheduled sync
