# 📌 Shipping System - Quick Reference Card

**Print this page for quick access!**

---

## 🚀 Quick Start (5 Minutes)

### 1. Add to Checkout Page
```typescript
import ShippingOptions from "@/components/checkout/ShippingOptions"

<ShippingOptions
  productId={product.id}
  areaCode={area}
  onSelect={(method) => setShipping(method)}
/>
```

### 2. Submit with Order
```typescript
await createOrder({
  shipping_method: selectedMethod,  // "normal", "fast", or "night"
  shipping_area: area,
  // ... other order data
})
```

### 3. Done! ✅

---

## 🔗 API Endpoints

### Get Options
```bash
GET /store/shipping/options?productId=X&areaCode=Y

Response: { shipping_options: [...] }
```

### Validate Method
```bash
POST /store/shipping/validate
Body: { method: "fast", areaCode: "salmiya" }

Response: { valid: true/false }
```

---

## 💰 Prices

| Method | Price | Condition |
|--------|-------|-----------|
| Normal | KWD 1.000 | Always |
| Fast | KWD 3.000 | Area support |
| Night | KWD 5.000 | Product flag |

---

## 🌍 Fast Delivery Areas

```
✓ Kuwait City
✓ Salmiya
✓ Farwaniya
✓ Jahra
✓ Ahmadi
✓ Mubarak Al-Kabeer
✓ Hawalli
✓ Abbasiya
```

---

## 🏷️ Product Metadata Flag

```sql
-- Check if night allowed
SELECT metadata->>'allow_night_delivery' FROM product;

-- Enable for product
UPDATE product 
SET metadata = jsonb_set(metadata, '{allow_night_delivery}', 'true')
WHERE id = 'prod_123';
```

---

## 📂 Files Created

```
Backend:
  src/modules/shipping/service.ts
  src/modules/shipping/index.ts
  src/api/store/shipping/route.ts
  src/api/odoo/webhooks/products/route.ts (UPDATED)

Frontend:
  frontend/src/components/checkout/ShippingOptions.tsx
  frontend/src/types/shipping.ts
  frontend/src/lib/shipping.ts

Docs:
  docs/SHIPPING_INTEGRATION_GUIDE.md ← START HERE
  docs/SHIPPING_ACTION_CHECKLIST.md
  docs/SHIPPING_ARCHITECTURE_DIAGRAM.md
  docs/SHIPPING_IMPLEMENTATION_COMPLETE.md
```

---

## 🧪 Quick Test

```bash
# Test API
curl "http://localhost:9000/store/shipping/options?productId=test&areaCode=salmiya"

# Test Component
# Open checkout page → Should see shipping options

# Test Order
# Place order with Fast → Should save shipping method
```

---

## ⚡ Common Customizations

### Add Area to Fast Delivery
```typescript
// In service.ts, fastDeliveryAreas array
fastDeliveryAreas = [
  "your-area-here",  // ← ADD HERE
]
```

### Change Price
```typescript
// In service.ts, baseRates object
const baseRates = {
  normal: 1000,   // ← CHANGE HERE
  fast: 3000,
  night: 5000
}
```

### Add Surcharge Logic
```typescript
// In calculateShippingPrice() method
if (options.weight > 1) {
  price += (options.weight - 1) * 500;  // Weight charge
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Service not available" | Check module registration |
| "Night not showing" | Set `allow_night_delivery: true` in metadata |
| "Fast not showing" | Add area to fast delivery list |
| "API 404" | Verify route file in correct directory |
| "Component error" | Check import path and dependencies |

---

## 📱 Component Props

```typescript
interface ShippingOptionsProps {
  productId?: string        // For night delivery check
  areaCode?: string         // For fast delivery check
  onSelect?: (method) => void  // Selection callback
  className?: string        // Tailwind classes
}
```

---

## 📊 Response Format

```json
{
  "shipping_options": [
    {
      "id": "normal",
      "name": "Normal Delivery",
      "description": "2-3 business days",
      "price": 1000,
      "estimatedDays": { "min": 2, "max": 3 },
      "enabled": true
    }
  ],
  "message": "Found X available methods"
}
```

---

## 🎨 Component States

```
LOADING   → Shows skeleton loaders
ERROR     → Shows error message + retry button
SUCCESS   → Shows radio button options
EMPTY     → Shows "No methods available"
```

---

## 🔄 Data Flow

```
Customer checkout
    ↓
ShippingOptions Component
    ↓
fetch /store/shipping/options
    ↓
ShippingService
    ├─ Check product metadata
    ├─ Check area support
    └─ Return options
    ↓
Component renders options
    ↓
Customer selects
    ↓
Submit order with shipping_method
```

---

## 💾 Database

```sql
-- Product table has metadata JSONB column
-- Stores: { allow_night_delivery: boolean }

-- Query all night delivery products
SELECT id, title FROM product 
WHERE metadata->>'allow_night_delivery' = 'true';
```

---

## 🚀 Deployment

```bash
# Build backend
npm run build

# Build frontend  
cd frontend && npm run build

# Deploy & restart
pm2 restart all

# Verify
curl http://localhost:9000/store/shipping/options
```

---

## 📞 Key Contacts

**Frontend Component**: 
`src/components/checkout/ShippingOptions.tsx`

**Backend Service**: 
`src/modules/shipping/service.ts`

**API Routes**: 
`src/api/store/shipping/route.ts`

**Documentation**: 
`docs/SHIPPING_INTEGRATION_GUIDE.md`

---

## ✅ Launch Checklist

- [ ] Backend compiles ✓
- [ ] Frontend builds ✓
- [ ] APIs respond ✓
- [ ] Component renders ✓
- [ ] Mobile view works ✓
- [ ] Database has metadata ✓
- [ ] All 3 methods tested ✓
- [ ] Error handling verified ✓

---

## 🎯 Next Steps

1. **TODAY**: Review this reference + check files
2. **TOMORROW**: Integrate into checkout
3. **THIS WEEK**: Test locally, deploy to staging
4. **NEXT WEEK**: Production deploy + monitor

---

**Print & Keep Handy!** 📌

