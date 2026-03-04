# Marqa Souq - Flutter Developer Quick Reference Guide

> Quick reference for Flutter mobile app development

---

## 🚀 Quick Start

### Environment Configuration

```dart
// lib/config/api_config.dart

class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:9000';
  
  // Production
  static const String prodBaseUrl = 'https://api.marqasouq.com';
  
  // Publishable API Key (safe for client-side)
  static const String publishableKey = 'pk_3971873a84ad4ec5ea711738227a4be2f078a2fd872f40125628afc860b9887b';
  
  // Default Region (Oman)
  static const String defaultRegionId = 'reg_01KAARY0EYGZY423VSZV7DVX25';
  
  // Default Currency
  static const String defaultCurrency = 'omr';
}
```

---

## 📱 API Endpoints Quick Reference

### Public Endpoints (No Auth Required)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Homepage | GET | `/store/homepage?locale={en|ar}` |
| Products List | GET | `/store/products?region_id={id}` |
| Product Detail | GET | `/store/products/{id}?region_id={id}` |
| Product Reviews | GET | `/store/products/{id}/reviews` |
| Categories | GET | `/store/product-categories` |
| Collections | GET | `/store/collections` |
| Brands | GET | `/store/brands` |
| Brand Detail | GET | `/store/brands/{slug}` |
| Banners | GET | `/store/media/banners?type={hero|dual}` |
| Videos | GET | `/store/media/videos` |
| Sellers | GET | `/store/sellers` |
| Regions | GET | `/store/regions` |
| Shipping Options | GET | `/store/shipping-options/{cart_id}` |

### Auth Endpoints

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/auth/customer/emailpass/register` |
| Login | POST | `/auth/customer/emailpass` |
| Reset Password | POST | `/auth/customer/emailpass/reset-password` |

### Cart Endpoints (No Auth Required)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Create Cart | POST | `/store/carts` |
| Get Cart | GET | `/store/carts/{id}` |
| Add Item | POST | `/store/carts/{id}/line-items` |
| Update Item | POST | `/store/carts/{id}/line-items/{item_id}` |
| Remove Item | DELETE | `/store/carts/{id}/line-items/{item_id}` |
| Update Cart | POST | `/store/carts/{id}` |
| Add Shipping | POST | `/store/carts/{id}/shipping-methods` |
| Init Payment | POST | `/store/carts/{id}/payment-sessions` |
| Complete | POST | `/store/carts/{id}/complete` |

### Protected Endpoints (Auth Required)

| Feature | Method | Endpoint |
|---------|--------|----------|
| My Profile | GET | `/store/customers/me` |
| Update Profile | POST | `/store/customers/me` |
| Add Address | POST | `/store/customers/me/addresses` |
| Delete Address | DELETE | `/store/customers/me/addresses/{id}` |
| My Orders | GET | `/store/orders` |
| Order Detail | GET | `/store/orders/{id}` |
| My Wishlist | GET | `/store/wishlist` |
| Add to Wishlist | POST | `/store/wishlist/items` |
| Remove from Wishlist | DELETE | `/store/wishlist/items/{id}` |
| Submit Review | POST | `/store/products/{id}/reviews` |
| My Warranties | GET | `/store/warranty?email={email}` |

---

## 🔐 Headers

### Required for ALL Store Requests

```dart
headers: {
  'x-publishable-api-key': 'pk_your_key',
  'Content-Type': 'application/json',
}
```

### For Authenticated Requests

```dart
headers: {
  'x-publishable-api-key': 'pk_your_key',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $customerToken',
}
```

---

## 💰 Price Formatting

Prices are returned in smallest currency unit (baisa for OMR):

```dart
/// Format price from API (baisa) to display string
String formatPrice(int amount, {String currency = 'omr'}) {
  switch (currency.toLowerCase()) {
    case 'omr':
      // OMR uses 1000 baisa = 1 OMR
      final value = amount / 1000;
      return 'OMR ${value.toStringAsFixed(3)}';
    case 'usd':
    case 'aed':
    default:
      // Most currencies use 100 subunits
      final value = amount / 100;
      return '${currency.toUpperCase()} ${value.toStringAsFixed(2)}';
  }
}

// Example:
// 599000 (baisa) -> "OMR 599.000"
// 59900 (cents) -> "USD 599.00"
```

---

## 🛒 Cart Flow

```dart
// 1. Create Cart
final cart = await api.createCart(regionId: 'reg_01...');

// 2. Add Items
await api.addToCart(cartId: cart.id, variantId: 'variant_01...', quantity: 1);

// 3. Update with customer info
await api.updateCart(
  cartId: cart.id,
  email: 'customer@example.com',
  shippingAddress: AddressData(...),
  billingAddress: AddressData(...),
);

// 4. Get & Select Shipping
final options = await api.getShippingOptions(cartId: cart.id);
await api.addShippingMethod(cartId: cart.id, optionId: options[0].id);

// 5. Initialize Payment (COD = 'manual')
await api.initPayment(cartId: cart.id, providerId: 'manual');

// 6. Complete Order
final order = await api.completeCart(cartId: cart.id);
```

---

## 🏠 Homepage Sections

The homepage API returns these section types:

| Section ID | Type | Description |
|------------|------|-------------|
| `hero` | `banner` | Hero slider images |
| `host_deals` | `product_grid` | Hot deals products |
| `best_in_powerbanks` | `product_grid` | Powerbank collection |
| `best_in_laptops` | `product_grid` | Laptop collection |
| `new_arrival` | `product_grid` | New arrivals |
| `recommended` | `product_grid` | Recommended products |

```dart
// Parse homepage response
final homepage = await api.getHomepage(locale: 'en');

for (final section in homepage.sections) {
  switch (section.type) {
    case 'banner':
      // Display HeroSlider with section.items
      break;
    case 'product_grid':
      // Display ProductGrid with section.products
      break;
  }
}
```

---

## 🔍 Product Search & Filtering

```dart
// Search by query
GET /store/products?q=iphone&region_id=reg_01...

// Filter by category
GET /store/products?category_id[]=pcat_01...&region_id=reg_01...

// Filter by collection
GET /store/products?collection_id[]=pcol_01...&region_id=reg_01...

// Filter by price (coming from calculated_price)
// Note: Filter client-side after fetching

// Pagination
GET /store/products?limit=12&offset=24&region_id=reg_01...

// Sort
GET /store/products?order=-created_at&region_id=reg_01...  // Newest first
GET /store/products?order=title&region_id=reg_01...        // A-Z
```

---

## 📦 Order Status Values

```dart
enum OrderStatus {
  pending,      // Order placed, awaiting processing
  completed,    // Order completed
  archived,     // Order archived
  canceled,     // Order canceled
  requiresAction, // Action needed
}

enum FulfillmentStatus {
  notFulfilled,       // Not yet processed
  partiallyFulfilled, // Some items shipped
  fulfilled,          // All items ready
  partiallyShipped,   // Some items delivered
  shipped,            // All items shipped
  partiallyReturned,  // Some items returned
  returned,           // All items returned
  canceled,           // Fulfillment canceled
}

enum PaymentStatus {
  notPaid,           // Payment not received
  awaiting,          // Awaiting payment (COD)
  captured,          // Payment received
  partiallyRefunded, // Partial refund issued
  refunded,          // Full refund issued
  canceled,          // Payment canceled
}
```

---

## 🌐 Localization

### RTL Support

```dart
// Arabic content is available in specific fields:
product.metadata?['title_ar']      // Arabic title
video.title_ar                     // Arabic video title
video.titleAr                      // Alias

// Check locale
final isRtl = locale == 'ar';
```

### Homepage Locale

```dart
// Get Arabic homepage
GET /store/homepage?locale=ar

// Get English homepage  
GET /store/homepage?locale=en
```

---

## 📲 Recommended Packages

```yaml
dependencies:
  # HTTP & Networking
  dio: ^5.4.0
  connectivity_plus: ^5.0.0
  
  # State Management
  provider: ^6.1.0
  # OR
  flutter_bloc: ^8.1.0
  # OR
  riverpod: ^2.4.0
  
  # Storage
  flutter_secure_storage: ^9.0.0  # For tokens
  shared_preferences: ^2.2.0       # For settings
  hive: ^2.2.3                     # For caching
  
  # Images
  cached_network_image: ^3.3.0
  
  # UI Components
  infinite_scroll_pagination: ^4.0.0
  carousel_slider: ^4.2.1
  shimmer: ^3.0.0
  
  # Utilities
  intl: ^0.18.0                    # i18n & formatting
  url_launcher: ^6.2.0
  
  # Video
  video_player: ^2.8.0
  chewie: ^1.7.0
```

---

## ⚠️ Error Handling

```dart
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? type;
  final List<FieldError>? errors;
  
  ApiException({
    required this.statusCode,
    required this.message,
    this.type,
    this.errors,
  });
  
  factory ApiException.fromResponse(Response response) {
    final data = response.data as Map<String, dynamic>?;
    return ApiException(
      statusCode: response.statusCode ?? 500,
      message: data?['message'] ?? 'Unknown error',
      type: data?['type'],
      errors: (data?['errors'] as List?)
          ?.map((e) => FieldError.fromJson(e))
          .toList(),
    );
  }
}

// Handle errors
try {
  final products = await api.getProducts();
} on ApiException catch (e) {
  switch (e.statusCode) {
    case 401:
      // Redirect to login
      break;
    case 404:
      // Show not found
      break;
    case 429:
      // Rate limited - retry later
      break;
    default:
      // Show error message
      showSnackBar(e.message);
  }
}
```

---

## 🔄 Odoo Integration Notes

> **Important:** Products and inventory are synced from the client's Odoo ERP system.

- Products have `external_id` field containing Odoo reference
- Inventory quantities are real-time synced
- Prices are managed in Medusa but can be updated from Odoo
- Product metadata may contain Odoo-specific fields:
  ```dart
  product.metadata?['odoo_id']
  product.metadata?['odoo_sync_date']
  product.metadata?['brand_id']
  ```

---

## 📄 Documentation Files

| File | Description |
|------|-------------|
| `docs/MOBILE_API_DOCUMENTATION.md` | Full API documentation |
| `docs/Marqa_Souq_Mobile_API.postman_collection.json` | Postman collection for testing |
| `docs/homepage-contract.md` | Homepage data contract |
| `docs/medusajs-api-coverage.md` | API coverage overview |

---

## 📞 Support

For API issues or questions:
- Review the full documentation in `docs/MOBILE_API_DOCUMENTATION.md`
- Import Postman collection to test endpoints
- Check Medusa server logs for debugging

---

*Last Updated: January 7, 2026*
