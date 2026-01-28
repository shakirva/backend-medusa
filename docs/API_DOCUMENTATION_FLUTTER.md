# Marqa Souq - Mobile API Documentation for Flutter Developer

## Overview

This document provides comprehensive API documentation for building the Marqa Souq Flutter mobile application. The backend is powered by MedusaJS v2 with custom extensions for Kuwait market.

## Base Configuration

### Endpoints

| Environment | Base URL |
|------------|----------|
| Development | `http://localhost:9000` |
| Production | `https://api.markasouq.com` (TBD) |

### Required Headers

All Store API requests require:

```http
x-publishable-api-key: pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b
Content-Type: application/json
```

### Region Configuration

| Setting | Value |
|---------|-------|
| Region ID | `reg_01KFYZNTFQ4AGNEVR15206N3GN` |
| Currency | KWD (Kuwaiti Dinar) |
| Currency Decimals | 3 (amounts in fils, 1000 fils = 1 KWD) |
| Country | Kuwait (KW) |

---

## Authentication APIs

### 1. Customer Registration

```http
POST /store/customers
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "Ahmed",
  "last_name": "Al-Sabah",
  "phone": "+965-12345678"
}
```

**Response (201 Created):**
```json
{
  "customer": {
    "id": "cus_01KFYZNTFQ4AGNEVR15206N3GN",
    "email": "user@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Sabah",
    "phone": "+965-12345678",
    "created_at": "2025-01-28T10:00:00.000Z"
  }
}
```

### 2. Customer Login

```http
POST /auth/customer/emailpass
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Store the token securely and include it in subsequent authenticated requests.

### 3. Authenticated Requests

For authenticated endpoints, include the token:

```http
Authorization: Bearer <token>
```

### 4. Get Current Customer

```http
GET /store/customers/me
```

**Headers:**
```http
Authorization: Bearer <token>
x-publishable-api-key: <publishable_key>
```

**Response:**
```json
{
  "customer": {
    "id": "cus_01KFYZNTFQ4AGNEVR15206N3GN",
    "email": "user@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Sabah",
    "phone": "+965-12345678",
    "addresses": []
  }
}
```

### 5. Logout

```http
DELETE /auth/session
```

---

## Product APIs

### 1. List Products

```http
GET /store/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Products per page (default: 20) |
| `offset` | number | Pagination offset |
| `region_id` | string | **Required for prices**: `reg_01KFYZNTFQ4AGNEVR15206N3GN` |
| `q` | string | Search query |
| `category_id` | string | Filter by category |
| `collection_id` | string | Filter by collection |
| `tags` | string[] | Filter by tags |
| `fields` | string | Include additional fields |

**Example:**
```http
GET /store/products?limit=20&offset=0&region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN&fields=+variants.calculated_price
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_01KFYZNTFQ4AGNEVR15206N3GN",
      "title": "Porodo 6 AC 2 USB-A 24W Power Hub",
      "handle": "porodo-6-ac-2-usb-a-24w-power-hub",
      "description": "High-quality power hub with multiple ports",
      "thumbnail": "https://example.com/image.jpg",
      "images": [
        {
          "id": "img_01KFYZNTFQ4AGNEVR15206N3GN",
          "url": "https://example.com/image1.jpg"
        }
      ],
      "variants": [
        {
          "id": "variant_01KFYZNTFQ4AGNEVR15206N3GN",
          "title": "Default",
          "sku": "PRD-001-BLK",
          "inventory_quantity": 50,
          "calculated_price": {
            "calculated_amount": 25500,
            "original_amount": 30000,
            "currency_code": "kwd"
          }
        }
      ],
      "metadata": {
        "brand": "Porodo",
        "odoo_id": 123
      }
    }
  ],
  "count": 223,
  "offset": 0,
  "limit": 20
}
```

### 2. Get Single Product

```http
GET /store/products/:handle
```

**Example:**
```http
GET /store/products/porodo-6-ac-2-usb-a-24w-power-hub?region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN&fields=+variants.calculated_price
```

### 3. Search Products

```http
GET /store/products?q=<search_term>&region_id=<region_id>
```

**Example:**
```http
GET /store/products?q=iphone&region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN&limit=20
```

---

## Category APIs

### 1. List Categories

```http
GET /store/product-categories
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `parent_category_id` | string | Get subcategories of a parent |
| `include_descendants_tree` | boolean | Include nested children |

**Response:**
```json
{
  "product_categories": [
    {
      "id": "pcat_01KFYZNTFQ4AGNEVR15206N3GN",
      "name": "Electronics",
      "handle": "electronics",
      "parent_category_id": null,
      "category_children": [
        {
          "id": "pcat_02KFYZNTFQ4AGNEVR15206N3GN",
          "name": "Smartphones",
          "handle": "smartphones"
        }
      ]
    }
  ]
}
```

### 2. Get Products by Category

```http
GET /store/products?category_id=<category_id>&region_id=<region_id>
```

---

## Collection APIs

### 1. List Collections

```http
GET /store/collections
```

**Response:**
```json
{
  "collections": [
    {
      "id": "pcol_01KFYZNTFQ4AGNEVR15206N3GN",
      "title": "New Arrivals",
      "handle": "new-arrivals"
    },
    {
      "id": "pcol_02KFYZNTFQ4AGNEVR15206N3GN",
      "title": "Best Sellers",
      "handle": "best-sellers"
    }
  ]
}
```

### 2. Get Products by Collection

```http
GET /store/products?collection_id=<collection_id>&region_id=<region_id>
```

---

## Cart APIs

### 1. Create Cart

```http
POST /store/carts
```

**Request Body:**
```json
{
  "region_id": "reg_01KFYZNTFQ4AGNEVR15206N3GN"
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart_01KFYZNTFQ4AGNEVR15206N3GN",
    "region_id": "reg_01KFYZNTFQ4AGNEVR15206N3GN",
    "currency_code": "kwd",
    "items": [],
    "subtotal": 0,
    "total": 0
  }
}
```

**Note:** Store the `cart.id` locally for subsequent cart operations.

### 2. Get Cart

```http
GET /store/carts/:cart_id
```

### 3. Add Item to Cart

```http
POST /store/carts/:cart_id/line-items
```

**Request Body:**
```json
{
  "variant_id": "variant_01KFYZNTFQ4AGNEVR15206N3GN",
  "quantity": 1
}
```

### 4. Update Cart Item Quantity

```http
POST /store/carts/:cart_id/line-items/:line_item_id
```

**Request Body:**
```json
{
  "quantity": 2
}
```

### 5. Remove Cart Item

```http
DELETE /store/carts/:cart_id/line-items/:line_item_id
```

### 6. Transfer Cart to Customer

When a user logs in, transfer their anonymous cart:

```http
POST /store/carts/:cart_id/customer
```

**Headers:**
```http
Authorization: Bearer <token>
```

---

## Checkout APIs

### 1. Update Cart with Shipping Address

```http
POST /store/carts/:cart_id
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "shipping_address": {
    "first_name": "Ahmed",
    "last_name": "Al-Sabah",
    "address_1": "Block 5, Street 10",
    "address_2": "Building 15, Apartment 3",
    "city": "Kuwait City",
    "country_code": "kw",
    "phone": "+965-12345678"
  },
  "billing_address": {
    "first_name": "Ahmed",
    "last_name": "Al-Sabah",
    "address_1": "Block 5, Street 10",
    "address_2": "Building 15, Apartment 3",
    "city": "Kuwait City",
    "country_code": "kw",
    "phone": "+965-12345678"
  }
}
```

### 2. Get Shipping Options

```http
GET /store/shipping-options?cart_id=<cart_id>
```

**Response:**
```json
{
  "shipping_options": [
    {
      "id": "so_01KFYZNTFQ4AGNEVR15206N3GN",
      "name": "Standard Delivery",
      "amount": 0,
      "calculated_price": {
        "calculated_amount": 0,
        "currency_code": "kwd"
      }
    },
    {
      "id": "so_02KFYZNTFQ4AGNEVR15206N3GN",
      "name": "Express Delivery",
      "amount": 0,
      "calculated_price": {
        "calculated_amount": 0,
        "currency_code": "kwd"
      }
    }
  ]
}
```

### 3. Add Shipping Method

```http
POST /store/carts/:cart_id/shipping-methods
```

**Request Body:**
```json
{
  "option_id": "so_01KFYZNTFQ4AGNEVR15206N3GN"
}
```

### 4. Initialize Payment Session

```http
POST /store/carts/:cart_id/payment-sessions
```

**Request Body:**
```json
{
  "provider_id": "pp_system_default"
}
```

**Note:** Currently using Cash on Delivery (COD). Payment gateway integration (KNET, etc.) coming soon.

### 5. Complete Order

```http
POST /store/carts/:cart_id/complete
```

**Response:**
```json
{
  "type": "order",
  "order": {
    "id": "order_01KFYZNTFQ4AGNEVR15206N3GN",
    "display_id": 1001,
    "status": "pending",
    "email": "user@example.com",
    "currency_code": "kwd",
    "total": 25500,
    "items": [...],
    "shipping_address": {...}
  }
}
```

---

## Order APIs

### 1. List Customer Orders

```http
GET /store/orders
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01KFYZNTFQ4AGNEVR15206N3GN",
      "display_id": 1001,
      "status": "pending",
      "fulfillment_status": "not_fulfilled",
      "payment_status": "awaiting",
      "currency_code": "kwd",
      "total": 25500,
      "created_at": "2025-01-28T10:00:00.000Z",
      "items": [
        {
          "id": "item_01KFYZNTFQ4AGNEVR15206N3GN",
          "title": "Porodo Power Hub",
          "quantity": 1,
          "unit_price": 25500,
          "thumbnail": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "count": 5
}
```

### 2. Get Single Order

```http
GET /store/orders/:order_id
```

---

## Address APIs

### 1. List Customer Addresses

```http
GET /store/customers/me/addresses
```

**Headers:**
```http
Authorization: Bearer <token>
```

### 2. Add Address

```http
POST /store/customers/me/addresses
```

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Sabah",
  "address_1": "Block 5, Street 10",
  "address_2": "Building 15, Apartment 3",
  "city": "Kuwait City",
  "country_code": "kw",
  "phone": "+965-12345678",
  "metadata": {
    "area": "Salmiya",
    "building_name": "Al Sabah Tower"
  }
}
```

### 3. Update Address

```http
POST /store/customers/me/addresses/:address_id
```

### 4. Delete Address

```http
DELETE /store/customers/me/addresses/:address_id
```

---

## Custom APIs (Marqa Souq Specific)

### 1. Homepage Data

```http
GET /store/custom/homepage
```

**Response:**
```json
{
  "banners": [...],
  "featured_products": [...],
  "categories": [...],
  "collections": [...]
}
```

### 2. Brand Products

```http
GET /store/products?tags=brand:porodo&region_id=<region_id>
```

---

## Error Handling

All errors follow this format:

```json
{
  "type": "invalid_data",
  "message": "Error description",
  "code": "error_code"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `not_found` | 404 | Resource not found |
| `invalid_data` | 400 | Invalid request data |
| `unauthorized` | 401 | Authentication required |
| `forbidden` | 403 | Access denied |
| `internal_error` | 500 | Server error |

---

## Price Formatting

All prices are in **fils** (smallest KWD unit):
- 1 KWD = 1000 fils
- Display format: `XX.XXX KWD`

**Example:**
```dart
String formatKWD(int fils) {
  double kwd = fils / 1000;
  return "${kwd.toStringAsFixed(3)} KWD";
}

// formatKWD(25500) => "25.500 KWD"
```

---

## Recommended Flutter Implementation

### 1. API Client Setup

```dart
class MedusaClient {
  static const String baseUrl = "http://localhost:9000";
  static const String publishableKey = "pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b";
  static const String regionId = "reg_01KFYZNTFQ4AGNEVR15206N3GN";
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    headers: {
      "x-publishable-api-key": publishableKey,
      "Content-Type": "application/json",
    },
  ));
  
  void setAuthToken(String token) {
    _dio.options.headers["Authorization"] = "Bearer $token";
  }
}
```

### 2. Local Storage Keys

| Key | Description |
|-----|-------------|
| `auth_token` | JWT authentication token |
| `cart_id` | Current cart ID |
| `wishlist` | JSON array of product IDs |
| `recent_searches` | Search history |

### 3. Wishlist (Local Storage)

Since Medusa doesn't have built-in wishlist, implement locally:

```dart
class WishlistService {
  static const _key = 'wishlist';
  
  Future<List<String>> getWishlist() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_key) ?? [];
  }
  
  Future<void> addToWishlist(String productId) async {
    final wishlist = await getWishlist();
    if (!wishlist.contains(productId)) {
      wishlist.add(productId);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_key, wishlist);
    }
  }
  
  Future<void> removeFromWishlist(String productId) async {
    final wishlist = await getWishlist();
    wishlist.remove(productId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, wishlist);
  }
}
```

---

## Testing Credentials

### Test Customer
- **Email:** test@markasouq.com
- **Password:** test123

### Test Admin (for debugging)
- **Email:** admin@markasouq.com
- **Password:** admin123

---

## Postman Collection

A complete Postman collection is available at:
`/docs/Marqa_Souq_Mobile_API.postman_collection.json`

---

## Support

For API questions or issues:
- Development Team Contact: [TBD]
- API Status Page: [TBD]

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-28 | Initial documentation |
