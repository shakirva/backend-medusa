
## Key Rules

| Rule | Detail |
|---|---|
| `cart_id` | **NEVER delete** — save once, keep forever in SharedPreferences |
| `jwt_token` | Delete on logout only |
| No JWT for cart | Create cart & add items work **without login** |
| Prices | In baisas — divide by **1000** for OMR display |
| After order | Create a **new cart** immediately |

---

## Local Storage

```dart
// On logout — only remove JWT:
prefs.remove('jwt_token');   // ✅
// ❌ DO NOT remove cart_id

// On app start — always check:
String? cartId = prefs.getString('cart_id');
if (cartId == null) {
  cartId = await createCart(); // POST /store/carts
  prefs.setString('cart_id', cartId);
}

// On re-login:
prefs.setString('jwt_token', newJwt);
await linkCartToCustomer(cartId, newJwt); // POST /store/carts/{id}/customer
```

---

## All Endpoints

### Base URL: `https://markasouqs.com`
### Region ID: `reg_01KAARY0EYGZY423VSZV7DVX25`

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 1 | POST | `/store/carts` | ❌ | Create cart |
| 2 | GET | `/store/carts/{id}` | ❌ | Get cart + items |
| 3 | POST | `/store/carts/{id}/line-items` | ❌ | Add item |
| 4 | POST | `/store/carts/{id}/line-items/{item_id}` | ❌ | Update qty |
| 5 | DELETE | `/store/carts/{id}/line-items/{item_id}` | ❌ | Remove item |
| 6 | POST | `/store/carts/{id}/customer` | ✅ JWT | Link to account |
| 7 | POST | `/store/carts/{id}` | ❌ | Set address/email/discount |
| 8 | POST | `/store/carts/{id}/shipping-methods` | ❌ | Set shipping |
| 9 | POST | `/store/carts/{id}/payment-sessions` | ❌ | Init payment |
| 10 | POST | `/store/carts/{id}/payment-session` | ❌ | Select payment |
| 11 | POST | `/store/carts/{id}/complete` | ❌ | Place order |

---

## Checkout Steps

```
1. POST /store/carts/{id}/customer          ← link to account (JWT)
2. POST /store/carts/{id}                   ← set email + address
3. GET  /store/shipping-options?cart_id={}  ← get options
4. POST /store/carts/{id}/shipping-methods  ← pick shipping
5. POST /store/carts/{id}/payment-sessions  ← { provider_id: "manual" }
6. POST /store/carts/{id}/payment-session   ← { provider_id: "manual" }
7. POST /store/carts/{id}/complete          ← place order ✅
8. POST /store/carts                        ← create new cart
```

---

## Edge Cases

| Situation | Solution |
|---|---|
| Cart 404 | Cart expired → create new cart |
| App reinstalled | `cart_id` wiped → create new cart on open |
| Same item added twice | MedusaJS auto-merges quantities ✅ |
| User adds items as guest, then logs in | Call `/customer` endpoint → items stay ✅ |

---

## Flutter — Cart Manager

```dart
class CartManager {
  final Dio _dio;
  final String base = 'https://markasouqs.com';
  final String regionId = 'reg_01KAARY0EYGZY423VSZV7DVX25';

  CartManager(this._dio);

  // Call on every app start
  Future<String> initCart() async {
    final prefs = await SharedPreferences.getInstance();
    String? cartId = prefs.getString('cart_id');

    if (cartId != null) {
      try {
        await _dio.get('$base/store/carts/$cartId');
      } catch (e) {
        if ((e as DioException).response?.statusCode == 404) cartId = null;
      }
    }

    cartId ??= await _createCart(prefs);

    final jwt = prefs.getString('jwt_token');
    if (jwt != null) await _linkToCustomer(cartId, jwt);

    return cartId;
  }

  Future<String> _createCart(SharedPreferences prefs) async {
    final res = await _dio.post('$base/store/carts', data: {'region_id': regionId});
    final id = res.data['cart']['id'] as String;
    await prefs.setString('cart_id', id);
    return id;
  }

  Future<void> _linkToCustomer(String cartId, String jwt) async {
    try {
      await _dio.post('$base/store/carts/$cartId/customer',
          options: Options(headers: {'Authorization': 'Bearer $jwt'}));
    } catch (_) {}
  }

  Future<Map> getCart(String id) async =>
      (await _dio.get('$base/store/carts/$id')).data['cart'];

  Future<Map> addItem(String cartId, String variantId, int qty) async =>
      (await _dio.post('$base/store/carts/$cartId/line-items',
          data: {'variant_id': variantId, 'quantity': qty})).data['cart'];

  Future<Map> updateItem(String cartId, String itemId, int qty) async =>
      (await _dio.post('$base/store/carts/$cartId/line-items/$itemId',
          data: {'quantity': qty})).data['cart'];

  Future<Map> removeItem(String cartId, String itemId) async =>
      (await _dio.delete('$base/store/carts/$cartId/line-items/$itemId')).data['cart'];

  Future<Map> completeCart(String cartId) async {
    final res = await _dio.post('$base/store/carts/$cartId/complete');
    final prefs = await SharedPreferences.getInstance();
    await _createCart(prefs); // fresh cart after order
    return res.data['order'];
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token'); // ✅ keep cart_id
  }
}
```
