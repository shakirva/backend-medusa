# 🎨 Shipping System - Visual Architecture

## System Overview

```
                    ┌─────────────────────────┐
                    │  Marqa Souq Customer    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  Storefront (Next.js)  │
                    │  ├─ Shop Page          │
                    │  ├─ Product Page       │
                    │  └─ Checkout Page ◄────┼─── SHIPPING OPTIONS
                    └───────────┬────────────┘    COMPONENT HERE
                                │
                    ┌───────────▼────────────┐
                    │  Medusa Backend        │
                    │  (Node.js/TypeScript)  │
                    │                        │
                    │  ┌─────────────────┐   │
                    │  │ Shipping Module │   │
                    │  ├─ Service ◄──────┼───┼─── Core Logic
                    │  ├─ Routes ◄───────┼───┼─── API Endpoints
                    │  └─ Types         │   │
                    │                    │   │
                    │  ┌─────────────────┐   │
                    │  │ Product Module  │   │
                    │  └──────┬──────────┘   │
                    │         │ metadata     │
                    │         │ sync         │
                    └─────────┼──────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  PostgreSQL Database │
                    │                      │
                    │  product table       │
                    │  ├─ id              │
                    │  ├─ title           │
                    │  └─ metadata ◄──────┼─── {
                    │     └─ allow_night     allow_night_delivery
                    │        _delivery      : true/false
                    │                    │  }
                    └────────────────────┘
                              ▲
                              │
                    ┌─────────┴────────────┐
                    │  Odoo Webhook       │
                    │  (Product Updates)  │
                    │                     │
                    │  Syncs when:        │
                    │  ├─ Product created │
                    │  ├─ Product updated │
                    │  └─ Fields change   │
                    └─────────────────────┘
```

---

## Request/Response Flow

### Scenario 1: Get Shipping Options

```
┌──────────────────────────────────────────────────────────────────┐
│ CUSTOMER AT CHECKOUT                                             │
│ ├─ Has laptop (allow_night_delivery: true)                      │
│ ├─ Location: Salmiya (fast delivery supported)                  │
│ └─ Clicks "Calculate Shipping"                                  │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ ShippingOptions  │
        │ Component        │
        │ (React)          │
        └────────┬─────────┘
                 │
                 │ fetch('/api/store/shipping/options?
                 │          productId=prod_123&
                 │          areaCode=salmiya')
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ BACKEND SHIPPING SERVICE                                         │
│                                                                  │
│ getAvailableShipping({                                          │
│   productId: "prod_123",                                        │
│   areaCode: "salmiya"                                           │
│ })                                                              │
│                                                                  │
│ 1. GET product from DB                                          │
│    └─ SELECT metadata FROM product WHERE id = 'prod_123'       │
│       └─ metadata.allow_night_delivery = true                   │
│                                                                  │
│ 2. CREATE options array                                         │
│    ├─ Push NORMAL (always)                                     │
│    │  └─ { id: "normal", price: 1000 }                         │
│    │                                                             │
│    ├─ Check if fast delivery area                              │
│    │  └─ isFastDeliveryArea("salmiya") = true                 │
│    │  └─ Push FAST                                             │
│    │     └─ { id: "fast", price: 3000 }                        │
│    │                                                             │
│    └─ Check product metadata                                    │
│       └─ allow_night_delivery = true                            │
│       └─ Push NIGHT                                             │
│          └─ { id: "night", price: 5000 }                        │
│                                                                  │
│ 3. RETURN options array                                         │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────▼────────────────┐
        │ Response (JSON)          │
        │ {                        │
        │   shipping_options: [    │
        │     {                    │
        │       id: "normal",      │
        │       name: "Normal...", │
        │       price: 1000        │
        │     },                   │
        │     {                    │
        │       id: "fast",        │
        │       price: 3000        │
        │     },                   │
        │     {                    │
        │       id: "night",       │
        │       price: 5000        │
        │     }                    │
        │   ]                      │
        │ }                        │
        └────────┬────────────────┘
                 │
        ┌────────▼────────────────┐
        │ Component renders:       │
        │ ○ Normal: KWD 1.000     │
        │ ○ Fast: KWD 3.000       │
        │ ● Night: KWD 5.000 ◄─── Customer selects
        └─────────────────────────┘
```

---

### Scenario 2: Product Without Night Delivery (Different Area)

```
CUSTOMER:
├─ Product: Phone case (allow_night_delivery: false)
└─ Area: Downtown (NO fast delivery)

getAvailableShipping({
  productId: "prod_456",
  areaCode: "downtown"
})

Processing:
├─ Step 1: Add NORMAL ✓
│  └─ { id: "normal", price: 1000 }
│
├─ Step 2: Check fast delivery area
│  └─ isFastDeliveryArea("downtown") = FALSE ✗
│  └─ Don't add FAST
│
└─ Step 3: Check night delivery flag
   └─ allow_night_delivery = false ✗
   └─ Don't add NIGHT

RESULT:
└─ OPTIONS: [NORMAL ONLY]
   └─ Customer sees only 1 option
```

---

## Component State Machine

```
┌──────────────┐
│ Initial      │
│ (mounting)   │
└──────┬───────┘
       │
       │ useEffect runs
       │
       ▼
┌──────────────┐
│ LOADING      │
│ state:       │
│ loading=true │
│              │
│ Shows:       │
│ [Skeleton]   │
│ [Skeleton]   │
│ [Skeleton]   │
└──────┬───────┘
       │
       │ API response
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
   SUCCESS      ERROR        NO DATA
    │            │             │
    └─┐          ┌┘             ┌┘
      │          │              │
      ▼          ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ READY        │ │ ERROR        │ │ EMPTY        │
│              │ │              │ │              │
│ state:       │ │ state:       │ │ state:       │
│ loading=false│ │ error text   │ │ options=[]   │
│ options=[..] │ │              │ │              │
│              │ │ Shows:       │ │ Shows:       │
│ Shows:       │ │ "Error..."   │ │ "No methods" │
│ Radio btns   │ │              │ │              │
│ Prices       │ │ ✓ Dismisses  │ │ Fallback:    │
│              │ │ ✓ Retries    │ │ NORMAL only  │
│ User clicks  │ │              │ │              │
│ option ──────┼─→ onSelect()   │ │              │
│              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Database Schema (Simplified)

```
PostgreSQL Table: product
┌─────────────────────────────────────────────────┐
│ Column          Type        Description         │
├─────────────────────────────────────────────────┤
│ id              TEXT        Primary key         │
│ title           TEXT        Product name        │
│ description     TEXT        Product info        │
│ status          TEXT        "published"         │
│ weight          NUMERIC     In kg               │
│ metadata        JSONB       ◄─── HERE!          │
│ created_at      TIMESTAMP   Creation date       │
│ updated_at      TIMESTAMP   Last update         │
└─────────────────────────────────────────────────┘

Metadata JSONB Structure:
{
  "odoo_id": 12345,
  "odoo_sku": "PROD-001",
  "odoo_category": "Electronics",
  "allow_night_delivery": true,           ◄─── KEY FIELD
  "synced_at": "2026-03-23T10:30:00Z"
}

Example Queries:

-- Find all products allowing night delivery
SELECT id, title FROM product 
WHERE metadata->>'allow_night_delivery' = 'true';

-- Update to enable night delivery
UPDATE product 
SET metadata = jsonb_set(
  metadata, 
  '{allow_night_delivery}', 
  'true'
)
WHERE title LIKE '%phone%';

-- Check specific product
SELECT metadata->>'allow_night_delivery' 
FROM product 
WHERE id = 'prod_123';
```

---

## API Endpoint Details

### GET /store/shipping/options

```
┌─ REQUEST ─────────────────────────────────────┐
│                                               │
│  GET /store/shipping/options                 │
│  Query Parameters:                           │
│  ├─ cartId (optional): "cart_xyz"           │
│  ├─ productId (optional): "prod_123"        │
│  └─ areaCode (optional): "salmiya"          │
│                                               │
│  Headers:                                    │
│  └─ Content-Type: application/json           │
│                                               │
└───────────────────────────────────────────────┘
                  │
                  ▼
┌─ PROCESSING ──────────────────────────────────┐
│                                               │
│  1. Parse query parameters                   │
│  2. Call shippingService.getAvailableShipping│
│  3. Build response                           │
│                                               │
└───────────────────────────────────────────────┘
                  │
                  ▼
┌─ RESPONSE ────────────────────────────────────┐
│ Status: 200 OK                               │
│                                               │
│ Body:                                        │
│ {                                            │
│   "shipping_options": [                      │
│     {                                        │
│       "id": "normal",                        │
│       "name": "Normal Delivery",            │
│       "description": "2-3 business days",   │
│       "price": 1000,                        │
│       "estimatedDays": {                    │
│         "min": 2,                           │
│         "max": 3                            │
│       },                                     │
│       "enabled": true                       │
│     },                                       │
│     {                                        │
│       "id": "fast",                         │
│       "name": "Fast Delivery",              │
│       "description": "Next day delivery",   │
│       "price": 3000,                        │
│       "estimatedDays": {                    │
│         "min": 1,                           │
│         "max": 1                            │
│       },                                     │
│       "enabled": true                       │
│     }                                        │
│   ],                                         │
│   "message": "Found 2 available..."         │
│ }                                            │
│                                               │
└───────────────────────────────────────────────┘
```

### POST /store/shipping/validate

```
┌─ REQUEST ─────────────────────────────────────┐
│                                               │
│  POST /store/shipping/validate               │
│                                               │
│  Body:                                       │
│  {                                           │
│    "method": "fast",                         │
│    "productId": "prod_123",                  │
│    "areaCode": "salmiya"                     │
│  }                                           │
│                                               │
└───────────────────────────────────────────────┘
                  │
                  ▼
┌─ PROCESSING ──────────────────────────────────┐
│                                               │
│  1. Get available methods                    │
│  2. Check if requested method in list        │
│  3. Return valid: true/false                 │
│                                               │
└───────────────────────────────────────────────┘
                  │
                  ▼
┌─ RESPONSE ────────────────────────────────────┐
│ Status: 200 OK                               │
│                                               │
│ Body (Valid):                                │
│ {                                            │
│   "method": "fast",                          │
│   "valid": true,                             │
│   "message": "Shipping method 'fast' is..."  │
│ }                                            │
│                                               │
│ Body (Invalid):                              │
│ {                                            │
│   "method": "night",                         │
│   "valid": false,                            │
│   "message": "Shipping method 'night'..."   │
│ }                                            │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Feature Matrix

```
┌──────────────┬────────────┬──────────────┬─────────────┐
│ Scenario     │ Normal     │ Fast         │ Night       │
├──────────────┼────────────┼──────────────┼─────────────┤
│ Always Show  │ YES ✓      │ NO           │ NO          │
│ Depends On   │ Nothing    │ Area Code    │ Product     │
│              │            │              │ Metadata    │
│ Price        │ KWD 1.000  │ KWD 3.000    │ KWD 5.000   │
│ Delivery     │ 2-3 days   │ 1 day        │ Same day    │
│ Use Case     │ Everyone   │ Main areas   │ Premium     │
├──────────────┼────────────┼──────────────┼─────────────┤
│ Default      │ YES (auto) │ NO           │ NO          │
│ Mobile       │ ✓ Works    │ ✓ Works      │ ✓ Works     │
│ Accessible   │ ✓ a11y     │ ✓ a11y       │ ✓ a11y      │
│ Error Safe   │ Always     │ With fall    │ With fall   │
│              │ available  │ back         │ back        │
└──────────────┴────────────┴──────────────┴─────────────┘
```

---

## File Tree

```
medusa/
├── src/
│   ├── api/
│   │   ├── odoo/webhooks/products/
│   │   │   └── route.ts ◄─── MODIFIED (added allow_night_delivery)
│   │   └── store/
│   │       └── shipping/
│   │           └── route.ts ◄─── NEW (API endpoints)
│   │
│   └── modules/
│       └── shipping/
│           ├── index.ts ◄─── NEW (module registration)
│           └── service.ts ◄─── NEW (core logic)
│
frontend/
└── src/
    ├── types/
    │   └── shipping.ts ◄─── NEW (TypeScript types)
    ├── lib/
    │   └── shipping.ts ◄─── NEW (utility functions)
    └── components/checkout/
        └── ShippingOptions.tsx ◄─── NEW (React component)

docs/
├── PROFESSIONAL_SHIPPING_IMPLEMENTATION.md ◄─── Technical guide
├── SHIPPING_QUICK_GUIDE.md ◄─── Visual guide
├── SHIPPING_IMPLEMENTATION_APPROACH.md ◄─── Strategy
├── SHIPPING_INTEGRATION_GUIDE.md ◄─── How to integrate
└── SHIPPING_IMPLEMENTATION_COMPLETE.md ◄─── This summary
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│ Production VPS (72.61.240.40)                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌────────────────┐         ┌──────────────────┐     │
│  │ Nginx (Proxy)  │         │ PM2 Process Mgr  │     │
│  │ Port 80/443    │────────→│ ├─ medusa-backend│     │
│  └────────────────┘         │ │ ├─ frontend    │     │
│                             │ └─ etc          │     │
│  ┌────────────────┐         └──────────────────┘     │
│  │ StoreFront     │                                   │
│  │ Next.js        │         ┌──────────────────┐     │
│  │ Port 3000      │────────→│ PostgreSQL       │     │
│  └────────────────┘         │ Port 5432        │     │
│                             │ medusa database  │     │
│                             └──────────────────┘     │
│                                                        │
│  Requests Flow:                                       │
│  1. Customer → Nginx (reverse proxy)                 │
│  2. Nginx → Next.js (storefront) or Medusa (API)    │
│  3. Medusa → PostgreSQL (shipping data)             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**This visual guide helps understand the complete shipping system architecture!**

