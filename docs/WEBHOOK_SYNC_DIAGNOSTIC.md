# 🔍 Webhook Sync Diagnostic Report

**Date**: March 23, 2026  
**Status**: ISSUES IDENTIFIED - FIXES REQUIRED  
**Severity**: HIGH

---

## Executive Summary

The Odoo product webhook is **PARTIALLY WORKING**:
- ✅ Products created/updated correctly
- ✅ Pricing synced correctly
- ✅ Images synced correctly
- ✅ Brands stored in metadata
- ✅ Inventory webhook exists separately
- ❌ **CRITICAL**: Categories NOT linked to products (only stored in metadata)
- ❌ **CRITICAL**: Inventory NOT synced with product webhook (separate endpoint)
- ❌ Subcategories not handled
- ❌ No brand relationships created

---

## Current Implementation Analysis

### 1. Product Webhook (`/api/odoo/webhooks/products`)

**What's Working** ✅
```typescript
// Category NAME is extracted
const category = p.categ_id && Array.isArray(p.categ_id) ? p.categ_id[1] : null

// Stored in metadata
const metadata = {
  odoo_id: odooId,
  odoo_category: category,    // ← Just stored as STRING
  odoo_brand: brand,          // ← Just stored as STRING
}
```

**What's Missing** ❌
```typescript
// NO relationship created between product and category!
// NO relationship created between product and brand!
// NO inventory levels updated!

// The correct way (from odoo-sync.ts):
await pg.raw(
  `INSERT INTO product_category_product (product_id, product_category_id) 
   VALUES (?, ?) ON CONFLICT DO NOTHING`,
  [productId, categoryId]
)
```

### 2. Inventory Webhook (`/api/odoo/webhooks/inventory`)

**Status**: EXISTS but is SEPARATE endpoint
- Requires separate API call to `/odoo/webhooks/inventory`
- Not called during product sync
- Quantity in `product.metadata.odoo_qty` is never synced to `inventory_level`

### 3. Database Schema

**Tables Involved**:
```
product                           ← Products created here ✓
  └─ metadata (JSONB)            ← Category/brand stored as TEXT ✓
  └─ product_category_product    ← **MISSING LINKAGE** ✗

product_category                  ← Categories exist
  └─ id, handle, name

product_variant                   ← Variants created ✓
  └─ sku

inventory_item                    ← **NOT CREATED** ✗
  └─ sku, title
  └─ inventory_level             ← **NOT CREATED** ✗
     └─ stocked_quantity

brand (Medusa)                    ← No table reference found
  └─ might not exist in Medusa v2
```

---

## Issues Found

### Issue #1: Categories Not Linked

**Problem**:
- Webhook extracts category name: `"Gaming / Monitor"`
- Stores it in metadata as text
- **Never creates** `product_category_product` relationship entry

**Impact**:
- Admin category list shows product count as 0
- Frontend cannot filter by category
- Product not visible in category pages

**Solution**:
1. Extract category name from Odoo payload
2. Map to Medusa category handle (using existing mapping function)
3. Find category ID from handle
4. Insert into `product_category_product` table

### Issue #2: Inventory Not Synced with Product

**Problem**:
- Product webhook stores quantity in `metadata.odoo_qty`
- Separate inventory webhook exists but requires manual calls
- No automatic inventory sync during product create/update

**Impact**:
- Inventory levels always 0
- Can't manage stock
- No backorder capability

**Solution**:
1. During product webhook, extract `qty_available`
2. Create/update `inventory_item` and `inventory_level` records
3. Store stocked quantity from Odoo

### Issue #3: Subcategories Not Handled

**Problem**:
- Only primary category (`categ_id`) is used
- Subcategories from Odoo not mapped
- Breadcrumb hierarchy lost

**Impact**:
- Can't display category hierarchy
- Product not in subcategory views

**Solution**:
- Accept `public_categ_ids` array from Odoo
- Create multiple category relationships
- Primary category first, then subcategories

### Issue #4: Brands Not Linked

**Problem**:
- Brand name stored in metadata only
- No `product_brand` table entries created

**Impact**:
- Brand filter doesn't work
- Can't group products by brand

**Solution**:
- Check if brand table exists in Medusa
- If yes: create brand relationship
- If no: keep in metadata (acceptable fallback)

---

## Database Relationships Needed

### Category Sync
```sql
-- Table: product_category_product
CREATE TABLE product_category_product (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES product(id),
  product_category_id TEXT NOT NULL REFERENCES product_category(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert during webhook
INSERT INTO product_category_product (product_id, product_category_id)
VALUES (?, ?)
ON CONFLICT DO NOTHING;
```

### Inventory Sync
```sql
-- Table: inventory_item
CREATE TABLE inventory_item (
  id TEXT PRIMARY KEY,
  sku VARCHAR(255) UNIQUE,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Table: inventory_level
CREATE TABLE inventory_level (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT REFERENCES inventory_item(id),
  location_id TEXT REFERENCES stock_location(id),
  stocked_quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  incoming_quantity INT DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Insert/update during webhook
UPDATE inventory_level 
SET stocked_quantity = ?
WHERE inventory_item_id = (SELECT id FROM inventory_item WHERE sku = ?);
```

---

## Comparison: Old vs New Webhook

### Old Sync Script (`odoo-sync.ts`) - WORKING ✅
```typescript
// Maps Odoo category path to Medusa handle
const catHandle = odooCategoryToHandle(category)  // e.g., "gaming"
const catId = catHandle ? categoryByHandle.get(catHandle) : null

// Creates proper relationship
if (catId) {
  await pg.raw(
    `INSERT INTO product_category_product (product_id, product_category_id) 
     VALUES (?, ?) ON CONFLICT DO NOTHING`,
    [productId, catId]
  )
}
```

### New Webhook (`/api/odoo/webhooks/products`) - BROKEN ❌
```typescript
// Only stores string in metadata
const metadata = {
  odoo_category: category,  // Just text, not linked!
}

// No category linking code!
```

---

## Required Webhook Changes

### In `/api/odoo/webhooks/products/route.ts`:

1. **Add category mapping function** (copy from odoo-sync.ts)
   - Maps Odoo paths to Medusa handles
   - e.g., "Gaming / Monitor" → "gaming"

2. **Add inventory creation logic**
   - Create inventory_item by SKU
   - Create inventory_level with stocked_quantity
   - Handle updates if already exists

3. **Add category linking logic**
   - After product created: insert into product_category_product
   - After product updated: insert/update category links

4. **Add brand linking logic** (if applicable)
   - Check if brand table exists
   - Create relationship if needed

5. **Handle subcategories** (optional)
   - Accept public_categ_ids array
   - Create multiple category relationships

---

## Implementation Roadmap

### Phase 1: Fix Categories (CRITICAL)
- [ ] Add odooCategoryToHandle() function to webhook
- [ ] Load category by handle mapping at webhook start
- [ ] Insert into product_category_product after product upsert
- [ ] Test: Product appears in admin category view
- [ ] Test: Category count increases

### Phase 2: Fix Inventory (HIGH)
- [ ] Extract qty_available from Odoo payload
- [ ] Find or create inventory_item by SKU
- [ ] Find or create inventory_level in default location
- [ ] Update stocked_quantity on webhook
- [ ] Test: Inventory shows correct quantity

### Phase 3: Handle Subcategories (MEDIUM)
- [ ] Modify OdooProductPayload to accept public_categ_ids
- [ ] Create multiple category relationships
- [ ] Map each subcategory to Medusa handle
- [ ] Test: Subcategory relationships created

### Phase 4: Brand Management (LOW)
- [ ] Check if Medusa v2 has brand table/relationship
- [ ] If yes: implement brand linking
- [ ] If no: keep current metadata approach

---

## Testing Checklist

### After Category Fix
- [ ] Push product to Medusa via webhook
- [ ] Check: product_category_product row created
- [ ] Check: Admin shows product in category
- [ ] Check: Category count increased
- [ ] Check: Multiple uploads don't duplicate

### After Inventory Fix
- [ ] Push product to Medusa via webhook
- [ ] Check: inventory_item created
- [ ] Check: inventory_level shows correct quantity
- [ ] Check: Update product qty → inventory updates
- [ ] Check: Can't sell more than stocked

---

## SQL Verification Queries

```sql
-- Check categories are linked
SELECT p.title, pc.handle, pc.name 
FROM product p
LEFT JOIN product_category_product pcp ON p.id = pcp.product_id
LEFT JOIN product_category pc ON pcp.product_category_id = pc.id
WHERE p.status = 'published'
LIMIT 10;

-- Check inventory exists
SELECT ii.sku, il.stocked_quantity, sl.name as location
FROM inventory_item ii
LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
LEFT JOIN stock_location sl ON il.location_id = sl.id
LIMIT 10;

-- Check metadata still has odoo fields
SELECT 
  title,
  metadata->>'odoo_id' as odoo_id,
  metadata->>'odoo_category' as odoo_category,
  metadata->>'odoo_qty' as odoo_qty
FROM product
WHERE metadata->>'odoo_id' IS NOT NULL
LIMIT 5;
```

---

## Files to Modify

1. **`src/api/odoo/webhooks/products/route.ts`**
   - Add category mapping function
   - Add category linking logic
   - Add inventory sync logic
   - Update OdooProductPayload interface

2. **`src/api/odoo/webhooks/inventory/route.ts`** (Optional)
   - Improve error handling
   - Add logging

---

## Notes

- **Webhook already working**: Products, pricing, images all sync correctly
- **Just need to add**: Category relationships + Inventory levels
- **No database migrations needed**: Tables already exist
- **Backward compatible**: Old metadata storage remains unchanged
- **Non-breaking change**: Existing products continue to work

---

**Next Steps**: Implement fixes in order of priority (Categories → Inventory → Subcategories → Brands)

