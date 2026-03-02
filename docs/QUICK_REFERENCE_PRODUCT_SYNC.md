# Quick Reference: Odoo Product Sync Implementation Guide

---

## 🚀 Quick Start Summary

### What We're Building
A complete product synchronization system that pulls **all product data from Odoo** and displays it correctly on the Marqa Souq storefront.

### Current Status
- ✅ Basic webhook exists (SKU, name, description, quantity)
- ❌ Missing 80% of product information

### What's Missing
- [ ] Product images handling
- [ ] Product variants and options
- [ ] Product attributes
- [ ] Pricing and taxes
- [ ] Product categories and brands
- [ ] SEO metadata
- [ ] Product relationships (accessories, alternatives)
- [ ] Product detail page
- [ ] Admin dashboard for monitoring

---

## 📊 Odoo → MedusaJS Field Mapping (Summary)

### Critical Fields (Must Have)
```
Odoo Field              → MedusaJS Location
─────────────────────────────────────────
id                      → product.metadata.odoo_id
name                    → product.title
default_code            → product_variant.sku
active                  → product.status
description             → product.metadata.description
list_price              → product_variant.prices[].amount
barcode                 → product_variant.barcode
image_1920              → product.images[0]
qty_available           → inventory_level.stocked_quantity
type                    → product.metadata.odoo_type
```

### High Priority Fields
```
description_ecommerce   → product.description
website_meta_title      → product.metadata.seo_title
website_meta_description → product.metadata.seo_description
categ_id                → product_category (link)
brand_id                → product.metadata.brand_id
product_variant_ids     → product_variant collection
attribute_line_ids      → product_option collection
website_published       → product.status visibility
sale_ok                 → product.metadata.sale_ok
purchase_ok             → product.metadata.purchase_ok
```

### Image Fields
```
image_1920              → Primary product image
image_1024              → Zoomable image
image_512               → Thumbnail
image_256               → Small image
image_128               → Icon
product_template_image_ids → Additional images
```

### Variant Information
```
product_variant_ids[].default_code     → variant.sku
product_variant_ids[].list_price        → variant.prices
product_variant_ids[].attribute_values  → variant.option_values
product_variant_ids[].barcode          → variant.barcode
```

---

## 🏗️ Architecture Components

### Backend Services (To Create/Update)

```
src/services/
├── odoo-product-service.ts      ← Main product sync logic
├── odoo-image-service.ts         ← Download and process images
├── odoo-variant-service.ts       ← Create and link variants
├── odoo-attribute-service.ts     ← Create product options
├── odoo-category-service.ts      ← Link to categories
└── odoo-sync-service.ts          ← Tracking and monitoring

src/lib/
├── odoo/
│   ├── product-mapper.ts         ← Field mapping logic
│   ├── validators.ts             ← Data validation
│   ├── image-processor.ts        ← Image handling
│   ├── variant-mapper.ts         ← Variant logic
│   └── logger.ts                 ← Sync logging

src/api/odoo/webhooks/
└── products/route.ts             ← Enhanced webhook endpoint

src/api/admin/products/
└── sync/route.ts                 ← Admin API for sync control

src/admin/routes/
└── products-sync/page.tsx        ← Admin dashboard for monitoring
```

### Database Tables (To Create)

```sql
-- Sync tracking tables
product_odoo_sync           ← Track product sync status
product_variant_odoo_sync   ← Track variant sync status
product_image_odoo_sync     ← Track image sync status

-- Columns to add to existing tables
product.odoo_id
product.sync_status
product_variant.odoo_id
product_variant.odoo_type
```

---

## 📋 Phase Breakdown (6 Weeks Total)

### Week 1: Core Fields & Webhook
**What:** Build foundation
- Update webhook to accept all fields
- Create database tables
- Implement field mapping
- Add error handling
**Files:** `products/route.ts`, `odoo-product-service.ts`

### Week 2: Images & Variants
**What:** Handle visual & variant data
- Download images from Odoo
- Process image sizes
- Create product variants
- Link variants to options
**Files:** `odoo-image-service.ts`, `odoo-variant-service.ts`

### Week 3: Attributes & Categories
**What:** Handle product organization
- Create product options
- Map attribute values
- Link to categories
- Link to brands
**Files:** `odoo-attribute-service.ts`, `odoo-category-service.ts`

### Week 4: Advanced Fields
**What:** Complete data sync
- Pricing and taxes
- SEO metadata
- Product relationships
- Status flags
**Files:** `odoo-product-service.ts` (extend)

### Week 5: Frontend & Admin
**What:** User-facing features
- Product detail page with all info
- Admin dashboard for monitoring
- Sync status tracking
- Manual sync controls
**Files:** `products/[handle]/page.tsx`, `products-sync/page.tsx`

### Week 6: Testing & Launch
**What:** Quality assurance
- Load testing
- Integration testing
- Documentation
- Production deployment

---

## 🔄 Data Flow Overview

```
ODOO Database
     ↓
[Webhook POST] → /odoo/webhooks/products
     ↓
Validate Payload
     ↓
Map Odoo Fields → MedusaJS Schema
     ↓
├─ Create/Update Product
├─ Create/Update Variants
├─ Create Options
├─ Download & Process Images
├─ Create ProductImages
├─ Set Pricing
├─ Set Inventory
└─ Store Sync Metadata
     ↓
Database Update
     ↓
Frontend Display
     ↓
User Sees Product on Storefront
```

---

## 📌 Key Implementation Patterns

### 1. Field Mapping
```typescript
interface OdooProduct {
  odoo_id: number;
  name: string;
  default_code: string;
  image_1920: string;
  list_price: number;
  // ... 200+ more fields
}

interface MedusaProduct {
  title: string;
  description: string;
  metadata: {
    odoo_id: number;
    odoo_type: string;
    // ... mapped metadata
  };
}
```

### 2. Error Handling
```typescript
try {
  // Sync logic
} catch (error) {
  // Log error
  // Store in database
  // Queue for retry
  // Send alert
}
```

### 3. Image Processing
```
1. Receive base64/URL from Odoo
2. Download and validate
3. Create resized versions (1024, 512, 256)
4. Upload to storage
5. Create ProductImage records
6. Store URLs in metadata
```

### 4. Variant Creation
```
1. Parse product_variant_ids from Odoo
2. Parse attribute_line_ids for options
3. Create Options in MedusaJS
4. Create OptionValues
5. Create ProductVariants
6. Link variants to option selections
```

---

## ✅ Testing Checklist (Per Phase)

### Phase 1: Webhook
- [ ] Webhook accepts all fields
- [ ] Field validation works
- [ ] Data stored in database
- [ ] Metadata saved correctly
- [ ] Error responses proper

### Phase 2: Images
- [ ] Images download from Odoo
- [ ] Image validation works
- [ ] Resized versions created
- [ ] Storage working
- [ ] ProductImages linked correctly

### Phase 3: Variants
- [ ] Variants created correctly
- [ ] Options created
- [ ] Option values assigned
- [ ] Variants linked to options
- [ ] Variant pricing correct

### Phase 4: Categories
- [ ] Categories synced
- [ ] Products linked
- [ ] Brands assigned
- [ ] Multiple categories handled

### Phase 5: Frontend
- [ ] Product detail page displays
- [ ] All descriptions shown
- [ ] Images load correctly
- [ ] Variants selectable
- [ ] Prices accurate

### Phase 6: Admin
- [ ] Dashboard displays status
- [ ] Logs show sync events
- [ ] Manual sync works
- [ ] Error messages clear

---

## 🚨 Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Missing required fields | Use strict validation |
| Image download failures | Implement retry logic |
| Variant creation errors | Handle missing attributes |
| Database constraint errors | Use proper foreign keys |
| Sync timeout | Implement background jobs |
| Memory issues with large images | Stream images, not load all |
| API rate limiting | Add request throttling |
| Duplicate syncs | Use idempotent operations |
| Incomplete error info | Log all context |
| No rollback capability | Backup before deploy |

---

## 📚 Reference Documents

1. **ODOO_PRODUCT_FIELDS_MAPPING_STRATEGY.md**
   - Detailed field-by-field mapping
   - Database schema design
   - Implementation patterns

2. **PROJECT_COMPLETION_ROADMAP.md**
   - Week-by-week breakdown
   - Architecture overview
   - Success metrics

3. **ODOO_WEBHOOK_API_DOCUMENTATION.md**
   - Webhook endpoint details
   - Current implementation
   - Payload format

4. **Current Webhook Implementation**
   - File: `src/api/odoo/webhooks/products/route.ts`
   - Shows basic structure
   - Extend with additional fields

---

## 🎯 Success Criteria

✅ All critical fields synced (100%)  
✅ 95%+ of high-priority fields synced  
✅ Product detail page complete  
✅ Admin dashboard working  
✅ Sync reliability 99.9%  
✅ Error handling robust  
✅ Documentation complete  
✅ Client satisfied  

---

## 💡 Pro Tips

1. **Start with one product type** - Test with simple products first, then handle variants
2. **Implement logging early** - Debug sync issues faster
3. **Use background jobs** - Don't block webhook response
4. **Create test data in Odoo** - Validate before production
5. **Monitor from day one** - Catch errors early
6. **Document as you go** - Make handoff easier
7. **Test with real data** - Sample data might miss edge cases
8. **Plan for failures** - Retry logic is essential
9. **Version your API** - Allow future changes
10. **Get client feedback** - Early and often

---

## 📞 Key Files to Know

| File | Purpose |
|------|---------|
| `src/api/odoo/webhooks/products/route.ts` | Main webhook endpoint |
| `medusa-config.ts` | Configuration |
| `package.json` | Dependencies |
| `tsconfig.json` | TypeScript config |
| `.env` | Environment variables |

---

## 🔗 Related Documentation

- **Odoo API Docs:** https://docs.odoo.com/
- **Medusa Docs:** https://docs.medusajs.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Image Processing:** Consider using sharp library
- **Background Jobs:** Use Bull or Bee-queue

---

**Status:** Ready to Start Phase 1  
**Last Updated:** March 3, 2026  
**Project:** Marqa Souq - Complete Product Sync from Odoo
