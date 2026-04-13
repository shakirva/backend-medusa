# MarqaSouq - Complete Flutter API Integration Guide

**Version:** 2.0.0  
**Last Updated:** January 30, 2026  
**Base URL:** `https://api.marqasouq.com` (Production) | `http://localhost:9000` (Development)

---

## Table of Contents

1. [Setup & Configuration](#1-setup--configuration)
2. [Authentication APIs](#2-authentication-apis)
3. [Products APIs](#3-products-apis)
4. [Categories APIs](#4-categories-apis)
5. [Brands APIs](#5-brands-apis)
6. [Cart APIs](#6-cart-apis)
7. [Checkout & Orders APIs](#7-checkout--orders-apis)
8. [Customer Account APIs](#8-customer-account-apis)
9. [Wishlist APIs](#9-wishlist-apis)
10. [Homepage & Banners APIs](#10-homepage--banners-apis)
11. [Media Gallery APIs](#11-media-gallery-apis)
12. [Reviews APIs](#12-reviews-apis)
13. [Regions & Shipping APIs](#13-regions--shipping-apis)
14. [Warranty APIs](#14-warranty-apis)
15. [Sellers APIs](#15-sellers-apis)
16. [Search APIs](#16-search-apis)
17. [Error Handling](#17-error-handling)
18. [Flutter Code Examples](#18-flutter-code-examples)

---

## 1. Setup & Configuration

### Required Headers for ALL Requests

```dart
final headers = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': 'pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b',
};
```

### For Authenticated Requests (Add)

```dart
headers['Authorization'] = 'Bearer $customerToken';
```

### Get Publishable Key (One-time setup)

```
GET /store/publishable-key
```

**Response:**
```json
{
  "publishable_key": "pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b"
}
```

---

## 2. Authentication APIs

### 2.1 Customer Registration

```
POST /auth/customer/emailpass/register
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "first_name": "Ahmed",
  "last_name": "Al-Rashid"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.2 Customer Login

```
POST /auth/customer/emailpass
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.3 Get Logged-in Customer

```
GET /store/customers/me
```

**Headers:** Requires `Authorization: Bearer {token}`

**Response:**
```json
{
  "customer": {
    "id": "cus_01ABC123",
    "email": "customer@example.com",
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "phone": "+965-12345678",
    "created_at": "2026-01-15T10:30:00.000Z"
  }
}
```

### 2.4 Update Customer Profile

```
POST /store/customers/me
```

**Headers:** Requires `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Rashid",
  "phone": "+965-99887766"
}
```

---

## 3. Products APIs

### 3.1 List Products

```
GET /store/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page (default: 20, max: 100) |
| `offset` | number | Skip items for pagination |
| `q` | string | Search query |
| `category_id` | string | Filter by category |
| `collection_id` | string | Filter by collection |
| `order` | string | Sort order: `created_at`, `-created_at`, `title`, `-title` |
| `region_id` | string | Region for pricing (required for prices) |

**Example Request:**
```
GET /store/products?limit=20&offset=0&region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_01KEVBHW78T3MQXDHP9ZVVSRCF",
      "title": "Liberty Guard Intelligent Film Cutting Plotter 16-inch-Orange",
      "handle": "liberty-guard-intelligent-film-cutting-plotter",
      "description": "Professional film cutting plotter...",
      "thumbnail": "https://example.com/image.jpg",
      "images": [
        {
          "id": "img_01ABC",
          "url": "https://example.com/image1.jpg"
        }
      ],
      "variants": [
        {
          "id": "variant_01KEVBHW79ZAPYP5J6ZFM67RST",
          "title": "Default",
          "sku": "LG-CPFL1625",
          "inventory_quantity": 2,
          "manage_inventory": true,
          "calculated_price": {
            "calculated_amount": 150000,
            "original_amount": 180000,
            "currency_code": "KWD"
          }
        }
      ],
      "collection": {
        "id": "pcol_01ABC",
        "title": "Electronics"
      },
      "categories": [
        {
          "id": "pcat_01ABC",
          "name": "Mobile Accessories"
        }
      ],
      "metadata": {
        "brand": "Liberty Guard"
      }
    }
  ],
  "count": 1500,
  "offset": 0,
  "limit": 20
}
```

### 3.2 Get Single Product

```
GET /store/products/{product_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `region_id` | string | Region for pricing |
| `fields` | string | Specific fields to include |

**Example:**
```
GET /store/products/prod_01KEVBHW78T3MQXDHP9ZVVSRCF?region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN&fields=+variants.calculated_price
```

**Response:**
```json
{
  "product": {
    "id": "prod_01KEVBHW78T3MQXDHP9ZVVSRCF",
    "title": "Liberty Guard Intelligent Film Cutting Plotter",
    "handle": "liberty-guard-intelligent-film-cutting-plotter",
    "description": "Full product description...",
    "thumbnail": "https://example.com/thumb.jpg",
    "images": [...],
    "variants": [...],
    "options": [
      {
        "id": "opt_01ABC",
        "title": "Color",
        "values": ["Orange", "Black", "White"]
      }
    ],
    "metadata": {
      "brand": "Liberty Guard",
      "warranty_months": 12
    }
  }
}
```

### 3.3 Search Products

```
GET /store/products?q={search_term}
```

**Example:**
```
GET /store/products?q=iPhone&limit=20&region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN
```

---

## 4. Categories APIs

### 4.1 List All Categories

```
GET /store/product-categories
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `parent_category_id` | string | Get children of a category (use `null` for root) |
| `include_descendants_tree` | boolean | Include nested children |

**Response:**
```json
{
  "product_categories": [
    {
      "id": "pcat_01ABC123",
      "name": "Electronics",
      "handle": "electronics",
      "description": "Electronic devices and accessories",
      "parent_category_id": null,
      "category_children": [
        {
          "id": "pcat_01DEF456",
          "name": "Mobile Phones",
          "handle": "mobile-phones"
        },
        {
          "id": "pcat_01GHI789",
          "name": "Accessories",
          "handle": "accessories"
        }
      ],
      "metadata": {
        "icon": "electronics-icon",
        "image_url": "/category/electronic.avif"
      }
    }
  ]
}
```

### 4.2 Get Single Category

```
GET /store/product-categories/{category_id}
```

### 4.3 Get Products by Category

```
GET /store/products?category_id={category_id}
```

---

## 5. Brands APIs

### 5.1 List All Brands

```
GET /store/brands
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "brands": [
    {
      "id": "brand_01ABC",
      "name": "Powerology",
      "slug": "powerology",
      "description": "Premium tech accessories",
      "logo_url": "/brands/powerology.svg",
      "is_active": true,
      "display_order": 1
    },
    {
      "id": "brand_02DEF",
      "name": "Samsung",
      "slug": "samsung",
      "logo_url": "/brands/samsung.svg",
      "is_active": true,
      "display_order": 2
    }
  ],
  "count": 6
}
```

### 5.2 Get Brand by Slug

```
GET /store/brands/{slug}
```

**Example:**
```
GET /store/brands/apple
```

**Response:**
```json
{
  "brand": {
    "id": "brand_01ABC",
    "name": "Apple",
    "slug": "apple",
    "description": "Apple Inc.",
    "logo_url": "/brands/apple.svg",
    "is_active": true
  },
  "products": [
    {
      "id": "prod_01ABC",
      "title": "iPhone 15 Pro",
      "thumbnail": "...",
      "variants": [...]
    }
  ],
  "count": 48
}
```

---

## 6. Cart APIs

### 6.1 Create Cart

```
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
    "id": "cart_01ABC123",
    "region_id": "reg_01KFYZNTFQ4AGNEVR15206N3GN",
    "items": [],
    "subtotal": 0,
    "tax_total": 0,
    "total": 0,
    "currency_code": "KWD"
  }
}
```

### 6.2 Get Cart

```
GET /store/carts/{cart_id}
```

**Response:**
```json
{
  "cart": {
    "id": "cart_01ABC123",
    "items": [
      {
        "id": "item_01XYZ",
        "title": "iPhone Case",
        "quantity": 2,
        "unit_price": 5000,
        "subtotal": 10000,
        "variant": {
          "id": "variant_01ABC",
          "sku": "CASE-001",
          "product": {
            "id": "prod_01ABC",
            "title": "iPhone Case",
            "thumbnail": "..."
          }
        }
      }
    ],
    "subtotal": 10000,
    "discount_total": 0,
    "tax_total": 500,
    "shipping_total": 1000,
    "total": 11500,
    "currency_code": "KWD"
  }
}
```

### 6.3 Add Item to Cart

```
POST /store/carts/{cart_id}/line-items
```

**Request Body:**
```json
{
  "variant_id": "variant_01KEVBHW79ZAPYP5J6ZFM67RST",
  "quantity": 1
}
```

### 6.4 Update Cart Item Quantity

```
POST /store/carts/{cart_id}/line-items/{line_item_id}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### 6.5 Remove Item from Cart

```
DELETE /store/carts/{cart_id}/line-items/{line_item_id}
```

### 6.6 Add Shipping Address

```
POST /store/carts/{cart_id}
```

**Request Body:**
```json
{
  "shipping_address": {
    "first_name": "Ahmed",
    "last_name": "Al-Rashid",
    "address_1": "Block 5, Street 10, House 25",
    "city": "Kuwait City",
    "country_code": "kw",
    "postal_code": "12345",
    "phone": "+965-12345678"
  }
}
```

### 6.7 Select Shipping Option

```
POST /store/carts/{cart_id}/shipping-methods
```

**Request Body:**
```json
{
  "option_id": "so_01ABC123"
}
```

### 6.8 Add Payment Session

```
POST /store/carts/{cart_id}/payment-sessions
```

**Request Body:**
```json
{
  "provider_id": "manual"
}
```

---

## 7. Checkout & Orders APIs

### 7.1 Complete Cart (Place Order)

```
POST /store/carts/{cart_id}/complete
```

**Response:**
```json
{
  "type": "order",
  "order": {
    "id": "order_01ABC123",
    "display_id": 1001,
    "status": "pending",
    "items": [...],
    "shipping_address": {...},
    "subtotal": 10000,
    "tax_total": 500,
    "shipping_total": 1000,
    "total": 11500,
    "currency_code": "KWD",
    "created_at": "2026-01-30T10:00:00.000Z"
  }
}
```

### 7.2 List Customer Orders

```
GET /store/orders
```

**Headers:** Requires `Authorization: Bearer {token}`

**Response:**
```json
{
  "orders": [
    {
      "id": "order_01ABC123",
      "display_id": 1001,
      "status": "pending",
      "fulfillment_status": "not_fulfilled",
      "payment_status": "awaiting",
      "items": [...],
      "total": 11500,
      "currency_code": "KWD",
      "created_at": "2026-01-30T10:00:00.000Z"
    }
  ],
  "count": 5
}
```

### 7.3 Get Single Order

```
GET /store/orders/{order_id}
```

---

## 8. Customer Account APIs

### 8.1 Get Customer Profile

```
GET /store/customers/me
```

**Headers:** Requires `Authorization: Bearer {token}`

### 8.2 Update Customer Profile

```
POST /store/customers/me
```

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Rashid",
  "phone": "+965-99887766",
  "metadata": {
    "preferred_language": "ar"
  }
}
```

### 8.3 List Customer Addresses

```
GET /store/customers/me/addresses
```

**Response:**
```json
{
  "addresses": [
    {
      "id": "addr_01ABC",
      "first_name": "Ahmed",
      "last_name": "Al-Rashid",
      "address_1": "Block 5, Street 10",
      "city": "Kuwait City",
      "country_code": "kw",
      "phone": "+965-12345678",
      "is_default_shipping": true
    }
  ]
}
```

### 8.4 Add New Address

```
POST /store/customers/me/addresses
```

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Al-Rashid",
  "address_1": "Block 5, Street 10, House 25",
  "city": "Kuwait City",
  "country_code": "kw",
  "postal_code": "12345",
  "phone": "+965-12345678"
}
```

### 8.5 Update Address

```
POST /store/customers/me/addresses/{address_id}
```

### 8.6 Delete Address

```
DELETE /store/customers/me/addresses/{address_id}
```

---

## 9. Wishlist APIs

### 9.1 Get Wishlist

```
GET /store/wishlist
```

**Headers:** Requires `Authorization: Bearer {token}`

**Response:**
```json
{
  "wishlist": {
    "id": "wish_01ABC",
    "customer_id": "cus_01ABC",
    "items": [
      {
        "id": "wishitem_01ABC",
        "product_id": "prod_01ABC",
        "variant_id": "variant_01ABC",
        "created_at": "2026-01-30T10:00:00.000Z"
      }
    ]
  }
}
```

### 9.2 Add to Wishlist

```
POST /store/wishlist/items
```

**Request Body:**
```json
{
  "product_id": "prod_01ABC123",
  "variant_id": "variant_01ABC123"
}
```

### 9.3 Remove from Wishlist

```
DELETE /store/wishlist/items/{item_id}
```

---

## 10. Homepage & Banners APIs

### 10.1 Get Homepage Data

```
GET /store/homepage
```

**Response:**
```json
{
  "homepage": {
    "hero_banners": [
      {
        "id": "banner_01ABC",
        "title": "Summer Sale",
        "subtitle": "Up to 50% off",
        "image_url": "/banner/hero-1.avif",
        "link": "/collections/summer-sale",
        "display_order": 1
      }
    ],
    "featured_categories": [...],
    "featured_products": [...],
    "promotions": [...]
  }
}
```

### 10.2 Get Hero Banners

```
GET /store/homepage/banners
```

**Response:**
```json
{
  "banners": [
    {
      "id": "banner_01ABC",
      "title": "New Arrivals",
      "subtitle": "Check out our latest products",
      "image_url": "/banner/hero-1.avif",
      "mobile_image_url": "/banner/hero-1-mobile.avif",
      "link": "/collections/new-arrivals",
      "is_active": true,
      "display_order": 1
    }
  ]
}
```

---

## 11. Media Gallery APIs

### 11.1 Get Media Items

```
GET /store/media
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |
| `type` | string | Filter by type: `video`, `image` |

**Response:**
```json
{
  "media": [
    {
      "id": "media_01ABC",
      "title": "Product Demo Video",
      "type": "video",
      "url": "https://example.com/video.mp4",
      "thumbnail_url": "/products/cat-1.png",
      "views": 266,
      "is_active": true
    }
  ],
  "count": 10
}
```

### 11.2 Get Single Media

```
GET /store/media/{media_id}
```

---

## 12. Reviews APIs

### 12.1 Get Product Reviews

```
GET /store/products/{product_id}/reviews
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "review_01ABC",
      "product_id": "prod_01ABC",
      "customer_id": "cus_01ABC",
      "customer_name": "Ahmed A.",
      "rating": 5,
      "title": "Great product!",
      "content": "Excellent quality and fast delivery.",
      "verified_purchase": true,
      "created_at": "2026-01-25T10:00:00.000Z"
    }
  ],
  "average_rating": 4.5,
  "total_reviews": 25
}
```

### 12.2 Submit Review

```
POST /store/products/{product_id}/reviews
```

**Headers:** Requires `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "rating": 5,
  "title": "Amazing product!",
  "content": "The quality exceeded my expectations."
}
```

---

## 13. Regions & Shipping APIs

### 13.1 List Regions

```
GET /store/regions
```

**Response:**
```json
{
  "regions": [
    {
      "id": "reg_01KFYZNTFQ4AGNEVR15206N3GN",
      "name": "Kuwait",
      "currency_code": "KWD",
      "tax_rate": 0,
      "countries": [
        {
          "iso_2": "kw",
          "name": "Kuwait"
        }
      ]
    }
  ]
}
```

### 13.2 Get Shipping Options

```
GET /store/shipping-options
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `cart_id` | string | Get options for specific cart |

**Response:**
```json
{
  "shipping_options": [
    {
      "id": "so_01ABC123",
      "name": "Standard Delivery",
      "price_type": "flat_rate",
      "amount": 1000,
      "currency_code": "KWD",
      "data": {
        "estimated_days": "3-5"
      }
    },
    {
      "id": "so_02DEF456",
      "name": "Express Delivery",
      "amount": 2500,
      "data": {
        "estimated_days": "1-2"
      }
    }
  ]
}
```

---

## 14. Warranty APIs

### 14.1 Check Warranty Status

```
GET /store/warranty/{product_id}
```

**Response:**
```json
{
  "warranty": {
    "product_id": "prod_01ABC",
    "warranty_months": 12,
    "warranty_type": "manufacturer",
    "terms": "Standard manufacturer warranty"
  }
}
```

### 14.2 Register Warranty

```
POST /store/warranty/register
```

**Headers:** Requires `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "order_id": "order_01ABC",
  "product_id": "prod_01ABC",
  "serial_number": "SN123456789"
}
```

---

## 15. Sellers APIs

### 15.1 List Sellers

```
GET /store/sellers
```

**Response:**
```json
{
  "sellers": [
    {
      "id": "seller_01ABC",
      "name": "TechZone Kuwait",
      "description": "Premium electronics retailer",
      "logo_url": "/sellers/techzone.png",
      "rating": 4.8,
      "total_products": 150
    }
  ]
}
```

### 15.2 Get Seller Products

```
GET /store/sellers/{seller_id}/products
```

---

## 16. Search APIs

### 16.1 Search Products

```
GET /store/products?q={search_query}
```

**Example:**
```
GET /store/products?q=powerbank&limit=20&region_id=reg_01KFYZNTFQ4AGNEVR15206N3GN
```

### 16.2 Search Suggestions (Autocomplete)

```
GET /store/products?q={partial_query}&limit=5&fields=id,title,thumbnail
```

---

## 17. Error Handling

### Error Response Format

```json
{
  "type": "error_type",
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| HTTP Status | Type | Description |
|-------------|------|-------------|
| 400 | `invalid_data` | Invalid request body or parameters |
| 401 | `unauthorized` | Missing or invalid authentication |
| 403 | `forbidden` | Access denied |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Resource conflict (e.g., duplicate email) |
| 422 | `invalid_request_error` | Validation error |
| 500 | `server_error` | Internal server error |

### Example Error Response

```json
{
  "type": "not_found",
  "message": "Product with id prod_01ABC not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## 18. Flutter Code Examples

### API Service Setup

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:9000';
  static const String publishableKey = 'pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b';
  static const String regionId = 'reg_01KFYZNTFQ4AGNEVR15206N3GN';
  
  String? _authToken;
  String? _cartId;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'x-publishable-api-key': publishableKey,
    if (_authToken != null) 'Authorization': 'Bearer $_authToken',
  };

  // Products
  Future<Map<String, dynamic>> getProducts({
    int limit = 20,
    int offset = 0,
    String? query,
    String? categoryId,
  }) async {
    final params = {
      'limit': limit.toString(),
      'offset': offset.toString(),
      'region_id': regionId,
      if (query != null) 'q': query,
      if (categoryId != null) 'category_id': categoryId,
    };
    
    final uri = Uri.parse('$baseUrl/store/products').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getProduct(String productId) async {
    final uri = Uri.parse('$baseUrl/store/products/$productId?region_id=$regionId&fields=+variants.calculated_price');
    final response = await http.get(uri, headers: _headers);
    return jsonDecode(response.body);
  }

  // Categories
  Future<Map<String, dynamic>> getCategories() async {
    final uri = Uri.parse('$baseUrl/store/product-categories?include_descendants_tree=true');
    final response = await http.get(uri, headers: _headers);
    return jsonDecode(response.body);
  }

  // Brands
  Future<Map<String, dynamic>> getBrands() async {
    final uri = Uri.parse('$baseUrl/store/brands');
    final response = await http.get(uri, headers: _headers);
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getBrandBySlug(String slug) async {
    final uri = Uri.parse('$baseUrl/store/brands/$slug?region_id=$regionId');
    final response = await http.get(uri, headers: _headers);
    return jsonDecode(response.body);
  }

  // Authentication
  Future<String?> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/customer/emailpass'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _authToken = data['token'];
      return _authToken;
    }
    return null;
  }

  Future<String?> register(String email, String password, String firstName, String lastName) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/customer/emailpass/register'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _authToken = data['token'];
      return _authToken;
    }
    return null;
  }

  // Cart
  Future<Map<String, dynamic>> createCart() async {
    final response = await http.post(
      Uri.parse('$baseUrl/store/carts'),
      headers: _headers,
      body: jsonEncode({'region_id': regionId}),
    );
    
    final data = jsonDecode(response.body);
    _cartId = data['cart']['id'];
    return data;
  }

  Future<Map<String, dynamic>> getCart() async {
    if (_cartId == null) return await createCart();
    
    final response = await http.get(
      Uri.parse('$baseUrl/store/carts/$_cartId'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> addToCart(String variantId, int quantity) async {
    if (_cartId == null) await createCart();
    
    final response = await http.post(
      Uri.parse('$baseUrl/store/carts/$_cartId/line-items'),
      headers: _headers,
      body: jsonEncode({
        'variant_id': variantId,
        'quantity': quantity,
      }),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateCartItem(String lineItemId, int quantity) async {
    final response = await http.post(
      Uri.parse('$baseUrl/store/carts/$_cartId/line-items/$lineItemId'),
      headers: _headers,
      body: jsonEncode({'quantity': quantity}),
    );
    return jsonDecode(response.body);
  }

  Future<void> removeFromCart(String lineItemId) async {
    await http.delete(
      Uri.parse('$baseUrl/store/carts/$_cartId/line-items/$lineItemId'),
      headers: _headers,
    );
  }

  // Checkout
  Future<Map<String, dynamic>> completeCart() async {
    final response = await http.post(
      Uri.parse('$baseUrl/store/carts/$_cartId/complete'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }

  // Orders
  Future<Map<String, dynamic>> getOrders() async {
    final response = await http.get(
      Uri.parse('$baseUrl/store/orders'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }

  // Homepage
  Future<Map<String, dynamic>> getHomepage() async {
    final response = await http.get(
      Uri.parse('$baseUrl/store/homepage'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
}
```

### Usage Example

```dart
final api = ApiService();

// Get products
final products = await api.getProducts(limit: 20);
print('Found ${products['count']} products');

// Search products
final searchResults = await api.getProducts(query: 'iPhone');

// Get categories
final categories = await api.getCategories();

// Get brands
final brands = await api.getBrands();

// Login
final token = await api.login('user@example.com', 'password123');

// Add to cart
await api.addToCart('variant_01ABC', 2);

// Get cart
final cart = await api.getCart();
print('Cart total: ${cart['cart']['total']}');
```

---

## Important Notes

1. **Currency**: All prices are in smallest currency unit (fils for KWD). Divide by 1000 for display.
   ```dart
   double displayPrice = apiPrice / 1000;
   ```

2. **Region ID**: Always include `region_id` when fetching products to get correct pricing.

3. **Inventory**: Stock quantities are synced from Odoo ERP in real-time.

4. **Images**: Product images may be from Odoo server or local storage.

5. **RTL Support**: Arabic content is available. Check `metadata.title_ar` for Arabic titles.

---

## Contact

For API issues or questions, contact the development team.

**API Base URL (Production):** `https://api.marqasouq.com`  
**API Base URL (Development):** `http://localhost:9000`  
**Publishable Key:** `pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b`  
**Default Region ID (Kuwait):** `reg_01KFYZNTFQ4AGNEVR15206N3GN`
