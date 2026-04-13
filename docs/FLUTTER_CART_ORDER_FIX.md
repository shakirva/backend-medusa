
## Problem
When creating a new cart and calling `/store/carts/{cart_id}/complete`, you get:
```
{"type":"invalid_data","message":"Payment collection has not been initiated for cart"}
```

## Reason
You're skipping the **payment session creation** step. Before completing a cart, you MUST create a payment session.

---

## Correct Cart → Order Flow (All Steps)

**Header required on ALL calls:**
```
x-publishable-api-key: pk_01JKNRHG6WWFZ3M5S4ACFAPMNT
```

### Step 1: Create Cart
```
POST https://admin.markasouqs.com/store/carts
Body: { "region_id": "<region_id>" }
```
→ Save `cart_id` from response

### Step 2: Add Line Items
```
POST https://admin.markasouqs.com/store/carts/{cart_id}/line-items
Body: { "variant_id": "<variant_id>", "quantity": 1 }
```

### Step 3: Set Email + Addresses
```
POST https://admin.markasouqs.com/store/carts/{cart_id}
Body:
{
  "email": "customer@example.com",
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Street",
    "city": "Muscat",
    "country_code": "om",
    "phone": "+96812345678"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Street",
    "city": "Muscat",
    "country_code": "om",
    "phone": "+96812345678"
  }
}
```

### Step 4: Add Shipping Method
```
POST https://admin.markasouqs.com/store/carts/{cart_id}/shipping-methods
Body: { "option_id": "<shipping_option_id>" }
```

To get available shipping options:
```
GET https://admin.markasouqs.com/store/shipping-options?cart_id={cart_id}
```

### Step 5: Get Payment Collection ID
```
GET https://admin.markasouqs.com/store/carts/{cart_id}
```
→ From response, get: `cart.payment_collection.id`

### Step 6: Create Payment Session ⚠️ (THIS IS THE STEP YOU'RE MISSING)
```
POST https://admin.markasouqs.com/store/payment-collections/{payment_collection_id}/payment-sessions
Body: { "provider_id": "pp_system_default" }
```

### Step 7: Complete Cart → Creates Order ✅
```
POST https://admin.markasouqs.com/store/carts/{cart_id}/complete
```

---

## Quick Summary

```
1. POST /store/carts                              → create cart
2. POST /store/carts/{id}/line-items               → add products  
3. POST /store/carts/{id}                          → set email + addresses
4. POST /store/carts/{id}/shipping-methods         → add shipping
5. GET  /store/carts/{id}                          → get payment_collection.id
6. POST /store/payment-collections/{pc_id}/payment-sessions  → ⚠️ REQUIRED
   Body: { "provider_id": "pp_system_default" }
7. POST /store/carts/{id}/complete                 → ✅ order placed!
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Payment collection has not been initiated for cart` | Missing Step 6 | Create payment session before completing |
| `Cart is already completed` | Using old cart_id | Create a new cart for each new order |
| `shipping_address is required` | Missing Step 3 | Set email and addresses before completing |

---

## Notes
- **Payment provider:** `pp_system_default` (Cash on Delivery / Manual payment)
- **Always create a NEW cart** for each new order. Completed carts cannot be reused.
- After Step 7 succeeds, the response will contain the `order` object with `order.id`.
