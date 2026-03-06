# Flutter Developer Feedback — Replies & Clarifications

> **Date:** 6 March 2026  
> **Project:** Marqa Souq — MedusaJS Backend  
> **For:** Flutter App Developer

---

## 1. `GET /store/media/banners` — Banner API

### Issue 1 — Add `title` and `button_text` to API response

**Current state:** `title` is already returned. `button_text` is not a separate field.

**Action:** We will add `button_text` to the Banner model and API response.

**Updated response shape:**
```json
{
  "id": "ban_...",
  "title": "New Arrivals",
  "button_text": "Shop Now",
  "link": "/categories/new-arrivals",
  "image_url": "https://admin.markasouqs.com/static/uploads/banner.jpg",
  "media": { "url": "https://admin.markasouqs.com/static/uploads/banner.jpg" },
  "position": "hero"
}
```

| Field | Use |
|---|---|
| `title` | Overlay heading on the banner |
| `button_text` | Label for the CTA button |
| `link` | Redirect URL when button/banner is tapped |

---

### Issue 2 — All images must be WebP, JPG, or PNG (no AVIF)

**Understood.** AVIF is not supported in Flutter without adding extra libraries (increases APK size).

**Actions being taken:**
- Server-side upload validation will be added — only `image/webp`, `image/jpeg`, `image/png` accepted.
- All existing AVIF banner images will be replaced with WebP.
- Database `image_url` values will be updated after re-upload.

> Until the next deployment, handle AVIF gracefully with a fallback placeholder image in the app.

---

## 2. `GET /store/products?collection_id[]=...&region_id=...` — Product Pricing

### Issue 1 — Which field is the final price?

**Use `variants[0].calculated_price.calculated_amount` as the final display price.**

Always pass these query params to get calculated prices:
```
?region_id=reg_01KAARY0EYGZY423VSZV7DVX25&fields=+variants.calculated_price
```

**Price priority (fallback order):**

| Priority | Field | Notes |
|---|---|---|
| 1st | `variants[0].calculated_price.calculated_amount` | Region-calculated final price ✅ |
| 2nd | `variants[0].prices[0].amount ÷ 1000` | Raw price (KWD/OMR ÷ 1000, AED ÷ 100) |
| 3rd | `product.metadata.list_price` | Odoo source price, last fallback |

---

### Issue 2 — No offer/discount field in response

**Offer data is already present**, mapped as follows:

| Field | Purpose |
|---|---|
| `calculated_price.original_amount` | Original "was" price (when higher than `calculated_amount`, product is on sale) |
| `metadata.compare_price` | Odoo compare/strike-through price |
| `metadata.ribbon` | Offer badge text — e.g. `"SALE"`, `"HOT DEAL"`, `"NEW"` |

**Discount % calculation:**
```
discount% = round((1 - calculated_amount / original_amount) * 100)
```

**Example response:**
```json
{
  "variants": [{
    "calculated_price": {
      "calculated_amount": 15.000,
      "original_amount": 20.000
    }
  }],
  "metadata": {
    "compare_price": 20.0,
    "ribbon": "SALE"
  }
}
```

---

## 3. `GET /store/filter-options` — Where to Place Options on Screen

The endpoint returns 3 sections. Map them to your filter screen like this:

### Response Structure

```json
{
  "filters": [...],
  "price_range": [...],
  "sort_options": [...]
}
```

### Screen Layout Mapping

| API Field | Screen Component |
|---|---|
| `sort_options` | Sort By dropdown |
| `price_range[].min` / `price_range[].max` | Price range slider |
| `filters` where `type = "color"` | Color chip selector |
| `filters` where `type = "size"` | Size chip selector |
| `filters` where `id = "brand"` | Brand dropdown/chips |
| `filters` where `type = "select"` | Other option chips |

### Optional: Filter by category
```
GET /store/filter-options?category_id=<category_id>
```
This scopes all filter options to products within that category only.

---

## 4. `GET /store/products` — Options vs Variants & Empty Tags

### Issue 1 — `options` vs `variants` — which has size?

**Short answer:**
- Use **`product.options`** → to **build the selector UI** (Size, Color, Storage etc.)
- Use **`product.variants`** → to **get pricing and stock** for the selected combination

**How it works:**

```
product.options = [
  { id: "opt_1", title: "Size", values: ["S", "M", "L", "XL"] }
]

product.variants = [
  { id: "var_1", title: "S", options: [{ option: { title: "Size" }, value: "S" }], price: 10.0 },
  { id: "var_2", title: "M", options: [{ option: { title: "Size" }, value: "M" }], price: 10.0 }
]
```

**Logic:**
1. Render size chips from `product.options[x].values`
2. When user taps "M", find the variant where `variant.options[].value === "M"`
3. Use that variant's `calculated_price` for checkout

---

### Issue 2 — Tags are empty

**Root cause:** Tags come from Odoo's `product_tag_ids`. Most products don't have tags assigned in Odoo yet.

**Actions:**
- Tags will be assigned in Odoo and re-synced to Medusa.
- After sync, `product.metadata.tags` will be a populated string array.

**Interim workaround:**
Use `product.metadata.ribbon` as a badge/tag — it already has values like:
```
"SALE" | "NEW" | "HOT DEAL" | "BEST SELLER"
```

---

