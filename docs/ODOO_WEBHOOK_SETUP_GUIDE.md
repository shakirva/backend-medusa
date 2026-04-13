# Odoo → Medusa Real-Time Webhook Setup Guide

> **For: Odoo Developer**  
> **Purpose:** Configure Odoo to push product changes to Medusa in real-time  
> **Endpoint:** `https://api.marquesouq.com/odoo/webhooks/products`

---

## Overview

When a product is **created or updated** in Odoo, we want it to automatically sync to the Medusa e-commerce backend within seconds. This is done via an **Automated Action** in Odoo that sends an HTTP POST to our webhook endpoint.

---

## Step 1: Create an Automated Action

1. Go to **Settings → Technical → Automation → Automated Actions**
2. Click **Create**
3. Fill in the following:

| Field | Value |
|-------|-------|
| **Action Name** | `Sync Product to Medusa` |
| **Model** | `Product Template` (`product.template`) |
| **Trigger** | `On Creation & Update` |
| **Action To Do** | `Execute Python Code` |

---

## Step 2: Python Code

Paste this code in the **Python Code** field:

```python
import json
import logging

_logger = logging.getLogger(__name__)

WEBHOOK_URL = "https://api.marquesouq.com/odoo/webhooks/products"
WEBHOOK_SECRET = "marqa-odoo-webhook-2026"

for rec in records:
    try:
        # Build product payload
        payload = {
            "webhook_secret": WEBHOOK_SECRET,
            "event": "product.updated",
            "product": {
                "id": rec.id,
                "name": rec.name or "",
                "description": rec.description_sale or rec.description or "",
                "list_price": rec.list_price or 0,
                "default_code": rec.default_code or "",
                "barcode": rec.barcode or "",
                "type": rec.detailed_type or "consu",
                "categ_id": [rec.categ_id.id, rec.categ_id.name] if rec.categ_id else False,
                "brand_id": [rec.product_brand_id.id, rec.product_brand_id.name] if hasattr(rec, 'product_brand_id') and rec.product_brand_id else False,
                "image_1920": rec.image_1920.decode('utf-8') if rec.image_1920 else False,
                "active": rec.active,
                "sale_ok": rec.sale_ok,
                "weight": rec.weight or 0,
                "volume": rec.volume or 0,
                "currency_id": [rec.currency_id.id, rec.currency_id.name] if rec.currency_id else [False, "OMR"],
            }
        }

        # Add variants
        variants = []
        for variant in rec.product_variant_ids:
            variants.append({
                "id": variant.id,
                "name": variant.name,
                "default_code": variant.default_code or "",
                "barcode": variant.barcode or "",
                "lst_price": variant.lst_price or 0,
                "qty_available": variant.qty_available or 0,
                "virtual_available": variant.virtual_available or 0,
            })
        payload["product"]["variants"] = variants

        # Send webhook
        import requests
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            _logger.info(f"Medusa webhook OK for product {rec.id}: {rec.name}")
        else:
            _logger.warning(f"Medusa webhook failed for product {rec.id}: {response.status_code} - {response.text}")

    except Exception as e:
        _logger.error(f"Medusa webhook error for product {rec.id}: {str(e)}")
```

---

## Step 3: Alternative — Simplified Payload

If the full payload above is too complex, you can send a **minimal payload** and let Medusa fetch the full product data:

```python
import json
import logging

_logger = logging.getLogger(__name__)

WEBHOOK_URL = "https://api.marquesouq.com/odoo/webhooks/products"
WEBHOOK_SECRET = "marqa-odoo-webhook-2026"

for rec in records:
    try:
        import requests
        response = requests.post(
            WEBHOOK_URL,
            json={
                "webhook_secret": WEBHOOK_SECRET,
                "event": "product.updated",
                "product": {
                    "id": rec.id,
                    "name": rec.name or "",
                    "list_price": rec.list_price or 0,
                    "default_code": rec.default_code or "",
                    "active": rec.active,
                }
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        _logger.info(f"Medusa sync: product {rec.id} -> {response.status_code}")
    except Exception as e:
        _logger.error(f"Medusa sync error: {str(e)}")
```

---

## Step 4: Test the Webhook

### From Odoo
1. Edit any product in Odoo (e.g., change the price)
2. Save the product
3. Check the Odoo logs for `Medusa webhook OK` or `Medusa sync:`

### Manual Test (via curl)
```bash
curl -X POST https://api.marquesouq.com/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_secret": "marqa-odoo-webhook-2026",
    "event": "product.updated",
    "product": {
      "id": 92581,
      "name": "Test Product",
      "list_price": 10.0,
      "default_code": "TEST001",
      "active": true
    }
  }'
```

Expected response: `{"success": true, ...}`

---

## Step 5: Brand Field Setup

The webhook supports brand synchronization. Medusa looks for the brand in these fields (in order):

1. `product.brand_id` — expects `[id, "Brand Name"]` tuple
2. `product.x_studio_brand_1` — custom field string

**If you use a custom brand field**, make sure to include it in the payload:

```python
# In the payload builder, add:
"x_studio_brand_1": rec.x_studio_brand_1 if hasattr(rec, 'x_studio_brand_1') else "",
```

---

## Important Notes

| Item | Detail |
|------|--------|
| **Webhook URL** | `https://api.marquesouq.com/odoo/webhooks/products` |
| **Secret** | `marqa-odoo-webhook-2026` (REQUIRED — requests without this are rejected) |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Timeout** | Set to 10-15 seconds |
| **Retry** | Odoo does not retry by default. Consider adding a cron job to retry failed syncs. |
| **Backup** | A cron job runs every 5 minutes on the Medusa side to pull recent changes, so even if the webhook fails, products will sync within 5 minutes. |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 / `invalid_secret` | Check `webhook_secret` value matches exactly |
| 500 / timeout | Product may have too large an image; try without `image_1920` |
| Product not appearing | Check admin at `https://admin.markasouqs.com/app/products` — search by name |
| Brand not appearing | Ensure `brand_id` is `[id, "Name"]` format, not just an integer |

---

## Contact

For any issues with the webhook endpoint, contact the Medusa backend team.
