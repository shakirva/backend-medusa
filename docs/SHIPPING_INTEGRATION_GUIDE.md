# 🚚 Shipping Implementation - Integration Guide

## ✅ What Was Implemented

### 1. Backend Changes

#### Added Odoo Field Sync
**File**: `src/api/odoo/webhooks/products/route.ts`
- Added `allow_night_delivery?: boolean` to `OdooProductPayload` interface
- Auto-syncs from Odoo to Medusa product metadata
- Default value: `false` if not set in Odoo

#### Created Shipping Service
**File**: `src/modules/shipping/service.ts`
- `ShippingService` class with methods:
  - `getAvailableShipping()` - Returns available methods based on conditions
  - `isFastDeliveryArea()` - Checks if area supports fast delivery
  - `productAllowsNightDelivery()` - Checks product metadata flag
  - `calculateShippingPrice()` - Calculates price (extensible for surcharges)
  - `validateShippingMethod()` - Validates if method is available

**Key Logic**:
```typescript
// NORMAL - Always available
options.push({ id: "normal", price: 1000 })

// FAST - Check if area is supported
if (isFastDeliveryArea(areaCode))
  options.push({ id: "fast", price: 3000 })

// NIGHT - Check if product allows it
if (productAllowsNightDelivery(productId))
  options.push({ id: "night", price: 5000 })
```

#### Created API Endpoint
**File**: `src/api/store/shipping/route.ts`
- `GET /store/shipping/options` - Get available methods
- `POST /store/shipping/validate` - Validate a method

**Example Requests**:
```bash
# Get available methods for a cart
curl "http://localhost:9000/store/shipping/options?cartId=cart_123&productId=prod_456&areaCode=salmiya"

# Validate a method
curl -X POST http://localhost:9000/store/shipping/validate \
  -H "Content-Type: application/json" \
  -d '{"method":"fast","productId":"prod_456","areaCode":"salmiya"}'
```

### 2. Frontend Changes

#### Created Shipping Types
**File**: `frontend/src/types/shipping.ts`
- `ShippingOption` interface
- `ShippingResponse` interface
- `ShippingMethod` type

#### Created Shipping Library
**File**: `frontend/src/lib/shipping.ts`
- `fetchShippingOptions()` - API call to get options
- `validateShippingMethod()` - Validate method selection
- `formatShippingPrice()` - Format fils to KWD
- `getDeliveryDateRange()` - Calculate delivery dates

#### Created React Component
**File**: `frontend/src/components/checkout/ShippingOptions.tsx`
- `ShippingOptions` component
- Shows loading, error, and option states
- Handles selection and callbacks
- Tailwind CSS styling

---

## 🔧 How to Integrate into Your Checkout

### Step 1: Add to Checkout Page

**In your checkout page** (e.g., `src/app/[lang]/checkout/page.js`):

```typescript
import ShippingOptions from "@/components/checkout/ShippingOptions"
import { useState } from "react"

export default function CheckoutPage() {
  const [selectedShipping, setSelectedShipping] = useState("normal")
  const { cart } = useCart() // Your cart context
  const [formData, setFormData] = useState({}) // Your form state

  return (
    <div className="checkout-container">
      {/* Your existing checkout fields */}
      
      {/* Add Shipping Options Component */}
      <ShippingOptions
        productId={cart?.items?.[0]?.product_id}
        areaCode={formData.area}
        onSelect={(method) => {
          setSelectedShipping(method)
          // Update your checkout state/form
        }}
      />

      {/* Shipping cost summary */}
      <div className="shipping-summary mt-6 p-4 bg-gray-50 rounded">
        <div className="flex justify-between">
          <span>Shipping Method:</span>
          <strong className="capitalize">{selectedShipping}</strong>
        </div>
      </div>

      {/* Continue to payment button */}
      <button
        onClick={() => {
          // Submit order with selected shipping method
          submitOrder({
            ...formData,
            shipping_method: selectedShipping,
          })
        }}
      >
        Continue to Payment
      </button>
    </div>
  )
}
```

### Step 2: Update Order Submission

When creating an order, send the selected shipping method:

```typescript
async function submitOrder(checkoutData) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...checkoutData,
      shipping_method: checkoutData.shipping_method, // "normal" | "fast" | "night"
      // Other order data...
    }),
  })
  
  return response.json()
}
```

### Step 3: Update Backend Order Processing

When creating an order, save the shipping method:

```typescript
// In your order creation endpoint
const order = await medusa.orders.create({
  customer_id: customerId,
  email: customerEmail,
  shipping_address: address,
  items: cartItems,
  
  // Add shipping method to metadata
  metadata: {
    shipping_method: checkoutData.shipping_method,
    shipping_area: checkoutData.area,
  },
  
  // ... other fields
})
```

---

## 📝 Configuration & Customization

### Add More Fast Delivery Areas

In `src/modules/shipping/service.ts`:

```typescript
private async isFastDeliveryArea(areaCode?: string): Promise<boolean> {
  // Add your areas here
  const fastDeliveryAreas = [
    "kuwait-city",
    "salmiya",
    "farwaniya",
    "jahra",
    "ahmadi",
    // ADD MORE AREAS
    "your-area-here",
  ]
  return fastDeliveryAreas.includes(areaCode?.toLowerCase() || "")
}
```

### Modify Shipping Prices

In `src/modules/shipping/service.ts`:

```typescript
const baseRates = {
  normal: 1000,  // KWD 1.000 in fils
  fast: 3000,    // KWD 3.000 in fils
  night: 5000,   // KWD 5.000 in fils - CHANGE HERE
}
```

### Add Weight-Based Surcharges

Update `calculateShippingPrice()` method:

```typescript
async calculateShippingPrice(options: {
  method: "normal" | "fast" | "night"
  weight?: number
  cartValue?: number
  itemCount?: number
}): Promise<number> {
  let price = baseRates[options.method]
  
  // Add weight charge: KWD 0.500 per kg over 1kg
  if (options.weight && options.weight > 1) {
    const weightCharge = (options.weight - 1) * 500 // 500 fils = KWD 0.500
    price += weightCharge
  }
  
  // Add value-based discount if order > KWD 50
  if (options.cartValue && options.cartValue > 50000) {
    price = 0 // Free shipping
  }
  
  return price
}
```

---

## 🧪 Testing

### Test 1: Get Shipping Options

```bash
# Normal product, Salmiya area (has Fast option)
curl "http://localhost:9000/store/shipping/options?productId=prod_test&areaCode=salmiya"

# Expected: [Normal, Fast, maybe Night if product allows]

# Product without night delivery, Downtown area (no Fast)
curl "http://localhost:9000/store/shipping/options?productId=prod_test2&areaCode=downtown"

# Expected: [Normal] only
```

### Test 2: Validate Methods

```bash
# Valid: normal is always valid
curl -X POST http://localhost:9000/store/shipping/validate \
  -H "Content-Type: application/json" \
  -d '{"method":"normal"}'
# Expected: { "valid": true }

# Conditional: fast only if area supports
curl -X POST http://localhost:9000/store/shipping/validate \
  -H "Content-Type: application/json" \
  -d '{"method":"fast","areaCode":"unknown-area"}'
# Expected: { "valid": false }
```

### Test 3: Enable Night Delivery

To test night delivery, you need to:

1. **Option A: Via Odoo**
   - In Odoo product form, set "Allow Night Delivery" = True
   - Product syncs automatically to Medusa

2. **Option B: Via Database (for testing)**
   ```sql
   UPDATE product 
   SET metadata = jsonb_set(metadata, '{allow_night_delivery}', 'true')
   WHERE id = 'prod_test';
   ```

3. **Then test**:
   ```bash
   curl "http://localhost:9000/store/shipping/options?productId=prod_test&areaCode=salmiya"
   # Expected: [Normal, Fast, Night]
   ```

---

## 📊 Database Updates

### Add Product Metadata

If you have existing products and want to enable night delivery:

```sql
-- Enable night delivery for all electronics
UPDATE product 
SET metadata = metadata || '{"allow_night_delivery": true}'
WHERE title LIKE '%phone%' OR title LIKE '%laptop%';

-- Disable night delivery for large items
UPDATE product 
SET metadata = metadata || '{"allow_night_delivery": false}'
WHERE title LIKE '%furniture%';

-- Check current status
SELECT id, title, metadata->>'allow_night_delivery' as night_allowed 
FROM product 
WHERE status = 'published'
LIMIT 10;
```

---

## 🚀 Deployment Checklist

- [ ] Updated `src/api/odoo/webhooks/products/route.ts` with `allow_night_delivery` field
- [ ] Created `src/modules/shipping/service.ts` shipping service
- [ ] Created `src/modules/shipping/index.ts` module registration
- [ ] Created `src/api/store/shipping/route.ts` API endpoints
- [ ] Created frontend types in `frontend/src/types/shipping.ts`
- [ ] Created frontend library `frontend/src/lib/shipping.ts`
- [ ] Created React component `frontend/src/components/checkout/ShippingOptions.tsx`
- [ ] Integrated component into checkout page
- [ ] Updated order submission to include `shipping_method`
- [ ] Updated order table/metadata to store shipping method
- [ ] Tested all 3 shipping methods
- [ ] Tested area-based fast delivery
- [ ] Tested product flag for night delivery
- [ ] Deployed backend changes to production
- [ ] Deployed frontend changes to production
- [ ] Updated Odoo to include `allow_night_delivery` field (if using Odoo)

---

## 📱 Mobile Responsive

The `ShippingOptions` component is mobile-friendly:
- Touch-friendly radio buttons (larger hit area)
- Responsive grid layout
- Clear pricing display
- Proper spacing on small screens

---

## Next Steps

1. **Test locally** - Run the checkout flow with all 3 shipping methods
2. **Verify APIs** - Use curl to test both endpoints
3. **Check database** - Confirm metadata is being synced from Odoo
4. **Deploy backend** - Push shipping service to production
5. **Deploy frontend** - Push React component to production
6. **Monitor** - Track shipping method selection rates

---

## Troubleshooting

### "Shipping service not available"
- Check if `src/modules/shipping/index.ts` is properly exporting the module
- Verify medusa-config.ts registers the shipping module

### "Product not found"
- Verify productId is correct
- Check database: `SELECT id FROM product WHERE id = 'your-id'`

### "Night delivery not showing"
- Check product metadata: `SELECT metadata FROM product WHERE id = 'prod_id'`
- Ensure `allow_night_delivery` is `true` in metadata
- If syncing from Odoo, check Odoo webhook is firing

### "Fast delivery not showing"
- Add area to `fastDeliveryAreas` array in service.ts
- Pass correct `areaCode` query parameter
- Test area code format (should match: "kuwait-city", "salmiya", etc.)

---

## API Response Examples

### GET /store/shipping/options

**Request**:
```
GET /store/shipping/options?productId=prod_123&areaCode=salmiya
```

**Response (200)**:
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
    },
    {
      "id": "fast",
      "name": "Fast Delivery",
      "description": "Next day delivery",
      "price": 3000,
      "estimatedDays": { "min": 1, "max": 1 },
      "enabled": true
    },
    {
      "id": "night",
      "name": "Night Delivery",
      "description": "Same day evening delivery",
      "price": 5000,
      "estimatedDays": { "min": 0, "max": 0.5 },
      "enabled": true
    }
  ],
  "message": "Found 3 available shipping methods"
}
```

### POST /store/shipping/validate

**Request**:
```json
{
  "method": "fast",
  "productId": "prod_123",
  "areaCode": "salmiya"
}
```

**Response (200)**:
```json
{
  "method": "fast",
  "valid": true,
  "message": "Shipping method 'fast' is available"
}
```

---

## Summary

✅ **Backend**: Shipping service with conditional logic  
✅ **Frontend**: React component with loading/error states  
✅ **API**: GET and POST endpoints for options and validation  
✅ **Integration**: Step-by-step checkout integration guide  
✅ **Testing**: Comprehensive testing checklist  
✅ **Database**: Auto-sync from Odoo with metadata flag  

**Ready to test!** 🎉

