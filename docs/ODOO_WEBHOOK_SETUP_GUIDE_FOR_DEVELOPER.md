# Odoo Webhook Setup Guide
### How to Automatically Sync New Products to MarqaSouq Website

---

## 🎯 What This Does

Every time you **create or update a product in Odoo**, it should **automatically appear on the MarqaSouq website** (admin dashboard + storefront).

For this to work, Odoo must **send a webhook (HTTP request)** to our server whenever a product is saved.

This guide explains exactly how to set that up.

---

## 📋 Webhook Details

| Field | Value |
|-------|-------|
| **URL** | `https://admin.markasouqs.com/odoo/webhooks/products` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Webhook Secret** | `marqa-odoo-webhook-2026` |

---

## 🛠️ Step-by-Step Setup in Odoo

### Step 1 — Go to Automated Actions

1. In Odoo, go to **Settings**
2. Enable **Developer Mode** (Settings → General Settings → scroll down → Activate Developer Mode)
3. Then go to: **Settings → Technical → Automation → Automated Actions**

---

### Step 2 — Create a New Automated Action

Click **"New"** and fill in:

| Field | Value |
|-------|-------|
| **Name** | `Sync Product to MarqaSouq Website` |
| **Model** | `Product Template (product.template)` |
| **Trigger** | `When a record is created or updated` |
| **Before Update Filter** | *(leave empty)* |
| **Action To Do** | `Execute Code` |

---

### Step 3 — Paste This Python Code

In the **"Python Code"** box, paste the following:

```python
import requests
import json

MEDUSA_URL = "https://admin.markasouqs.com/odoo/webhooks/products"
WEBHOOK_SECRET = "marqa-odoo-webhook-2026"

for record in records:
    try:
        payload = {
            "event_type": "product.created",
            "webhook_secret": WEBHOOK_SECRET,
            "product": {
                "odoo_id": record.id,
                "name": record.name,
                "default_code": record.default_code or "",
                "barcode": record.barcode or "",
                "list_price": record.list_price or 0,
                "currency_code": "kwd",
                "description_sale": record.description_sale or "",
                "weight": record.weight or 0,
                "brand": record.x_brand if hasattr(record, 'x_brand') else "",
                "categ_id": [record.categ_id.id, record.categ_id.name] if record.categ_id else False,
                "qty_available": record.qty_available or 0,
                "is_published": record.is_published if hasattr(record, 'is_published') else True,
                "image_url": f"https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/{record.id}/image_1920"
            }
        }

        response = requests.post(
            MEDUSA_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            log("✅ Synced to MarqaSouq: " + record.name)
        else:
            log("❌ Failed to sync: " + record.name + " | " + response.text)

    except Exception as e:
        log("❌ Error syncing " + record.name + ": " + str(e))
```

---

### Step 4 — Save and Test

1. Click **Save**
2. Now go to **Sales → Products**
3. Open any product (or the new one you just created)
4. Make a small change (e.g. add a space to the description) and click **Save**
5. The webhook will fire automatically

---

## 🧪 How to Manually Test the Webhook

If you want to test it manually without changing a product, use **Postman** or **cURL**:

### Using cURL (Terminal):
```bash
curl -X POST https://admin.markasouqs.com/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "product.created",
    "webhook_secret": "marqa-odoo-webhook-2026",
    "product": {
      "odoo_id": 92573,
      "name": "Levelo Cuir Leather Hybrid Case with Comfortable Grip for iPhone 17 Pro- Phantom Black",
      "default_code": "LEVELO-CUIR-17PRO-BLACK",
      "list_price": 12.900,
      "currency_code": "kwd",
      "description_sale": "Levelo Cuir Leather Hybrid Case",
      "is_published": true,
      "image_url": "https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92573/image_1920"
    }
  }'
```

### Using Postman:
1. Open Postman
2. Set method to **POST**
3. URL: `https://admin.markasouqs.com/odoo/webhooks/products`
4. Go to **Body → raw → JSON**
5. Paste:
```json
{
  "event_type": "product.created",
  "webhook_secret": "marqa-odoo-webhook-2026",
  "product": {
    "odoo_id": 92573,
    "name": "Levelo Cuir Leather Hybrid Case with Comfortable Grip for iPhone 17 Pro- Phantom Black",
    "default_code": "LEVELO-CUIR-17PRO-BLACK",
    "list_price": 12.900,
    "currency_code": "kwd",
    "description_sale": "Levelo Cuir Leather Hybrid Case",
    "is_published": true,
    "image_url": "https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92573/image_1920"
  }
}
```
6. Click **Send**

---

## ✅ Expected Response (Success)

```json
{
  "status": "success",
  "action": "created",
  "odoo_id": 92573,
  "product_name": "Levelo Cuir Leather Hybrid Case..."
}
```

If you see `"action": "created"` or `"action": "updated"` → **the product is now on the website ✅**

---

## ❌ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Invalid webhook_secret` | Wrong secret key | Use exactly: `marqa-odoo-webhook-2026` |
| `400 product.odoo_id required` | Missing odoo_id in payload | Make sure `odoo_id` is included |
| `500 Internal Server Error` | Server issue | Contact website developer |
| No response / timeout | Server unreachable | Check internet connection |

---

## 📦 Full Product Fields Reference

These are all the fields you can send (all optional except `odoo_id` and `name`):

```json
{
  "event_type": "product.created",
  "webhook_secret": "marqa-odoo-webhook-2026",
  "product": {
    "odoo_id": 92573,
    "name": "Product Name",
    "default_code": "SKU-001",
    "barcode": "6291234567890",
    "list_price": 12.900,
    "currency_code": "kwd",
    "description_sale": "Product description here",
    "weight": 0.15,
    "brand": "Levelo",
    "categ_id": [5, "Phone Cases"],
    "qty_available": 50,
    "is_published": true,
    "image_url": "https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92573/image_1920"
  }
}
```

---

## 🔄 Event Types

| Event Type | When to Use |
|------------|-------------|
| `product.created` | New product added in Odoo |
| `product.updated` | Product details changed in Odoo |
| `product.deleted` | Product archived/deleted in Odoo |

---

## ⚠️ Important Notes

1. **`odoo_id` and `name` are required** — all other fields are optional
2. **`currency_code` should be `"kwd"`** for Kuwait Dinar
3. **Prices are in KWD** (e.g. `12.900` = 12.900 KWD)
4. **Image URL** — use the Odoo image URL format above, our server will use it directly
5. If you send `is_published: false` → product will be saved as **Draft** (not visible on website)
6. If you send `is_published: true` → product will be **Published** (visible on website)

---

## 📞 Contact

If the webhook is set up and products are still not appearing, contact the website developer with:
- The **Odoo ID** of the product
- The **response** you received from the webhook call
- A **screenshot** of the Automated Action setup

---

*Last updated: March 2026 | MarqaSouq Integration Team*
