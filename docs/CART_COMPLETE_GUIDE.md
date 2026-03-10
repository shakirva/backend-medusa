# 🛒 Cart Guide
> MarqaSouq · MedusaJS v2 · March 10, 2026

---

## Key Rules

| Rule | Detail |
|---|---|
| `cart_id` | Clear on logout. Restore from **server** after re-login. |
| `jwt_token` | Delete on logout only |
| No JWT for cart ops | Create cart & add items work **without login** |
| Prices | In baisas — divide by **1000** for OMR display |
| After order | Create new cart + **save to server** immediately |

---

## Permanent Solution — Server-Side Cart Persistence

Cart `cart_id` is saved on the **customer's server account**, not just local storage.
This fixes all device scenarios: logout/re-login, new device, reinstall.

### Two New Endpoints

#### Get saved cart from server
```
GET /store/cart/session
Authorization: Bearer {jwt}
```
Response:
```json
{ "cart_id": "cart_01ABC..." }   // null if no saved cart
```

#### Save cart to server
```
POST /store/cart/session
Authorization: Bearer {jwt}
Content-Type: application/json

Body: { "cart_id": "cart_01ABC..." }
```
Response:
```json
{ "success": true, "cart_id": "cart_01ABC..." }
```

---

## All Scenarios — Fixed

| Scenario | Result |
|---|---|
| App restart | Reads from local prefs (fast) ✅ |
| Logout → re-login same device | Fetches cart_id from server ✅ |
| Login on new/different device | Fetches cart_id from server ✅ |
| App uninstall → reinstall | Fetches cart_id from server after login ✅ |
| Cart expired (404) | Creates new cart, saves to server ✅ |
| Two devices, same account | Both get the same cart from server ✅ |
| User A logout → User B login same device | User B gets their own server cart ✅ |

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
| 6 | POST | `/store/carts/{id}/customer` | ✅ JWT | Link cart to account |
| 7 | POST | `/store/carts/{id}` | ❌ | Set address/email/discount |
| 8 | POST | `/store/carts/{id}/shipping-methods` | ❌ | Set shipping |
| 9 | POST | `/store/carts/{id}/payment-sessions` | ❌ | Init payment |
| 10 | POST | `/store/carts/{id}/payment-session` | ❌ | Select payment |
| 11 | POST | `/store/carts/{id}/complete` | ❌ | Place order |
| **12** | **GET** | **`/store/cart/session`** | ✅ JWT | **Get saved cart_id from server** |
| **13** | **POST** | **`/store/cart/session`** | ✅ JWT | **Save cart_id to server** |

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
9. POST /store/cart/session                 ← save new cart_id to server ✅
```

---

## Flutter — Complete Cart Manager

```dart
class CartManager {
  final Dio _dio;
  final String base = 'https://markasouqs.com';
  final String regionId = 'reg_01KAARY0EYGZY423VSZV7DVX25';

  CartManager(this._dio);

  // App start before login (guest)
  Future<String> initCartGuest() async {
    final prefs = await SharedPreferences.getInstance();
    String? cartId = prefs.getString('cart_id');

    if (cartId != null) {
      try {
        await _dio.get('$base/store/carts/$cartId');
        return cartId;
      } catch (e) {
        if ((e as DioException).response?.statusCode == 404) cartId = null;
      }
    }

    return await _createCart(prefs);
  }

  // Call after login — restores cart from server
  Future<String> initCartAfterLogin(String jwt) async {
    final prefs = await SharedPreferences.getInstance();

    // Step 1: Check server for saved cart_id
    String? cartId;
    try {
      final res = await _dio.get('$base/store/cart/session',
          options: Options(headers: {'Authorization': 'Bearer $jwt'}));
      cartId = res.data['cart_id'];
    } catch (_) {}

    // Step 2: Validate cart still exists
    if (cartId != null) {
      try {
        await _dio.get('$base/store/carts/$cartId');
      } catch (e) {
        if ((e as DioException).response?.statusCode == 404) cartId = null;
      }
    }

    // Step 3: No valid cart → create new + save to server
    if (cartId == null) {
      cartId = await _createCart(prefs);
      await _saveCartToServer(cartId, jwt);
    } else {
      await prefs.setString('cart_id', cartId);
    }

    await _linkToCustomer(cartId, jwt);
    return cartId;
  }

  // Logout — clear local, server keeps it
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('cart_id');
    // ✅ Server still has cart_id under customer account
  }

  Future<Map> addItem(String cartId, String variantId, int qty) async =>
      (await _dio.post('$base/store/carts/$cartId/line-items',
          data: {'variant_id': variantId, 'quantity': qty})).data['cart'];

  Future<Map> updateItem(String cartId, String itemId, int qty) async =>
      (await _dio.post('$base/store/carts/$cartId/line-items/$itemId',
          data: {'quantity': qty})).data['cart'];

  Future<Map> removeItem(String cartId, String itemId) async =>
      (await _dio.delete('$base/store/carts/$cartId/line-items/$itemId')).data['cart'];

  Future<Map> completeCart(String cartId, String jwt) async {
    final res = await _dio.post('$base/store/carts/$cartId/complete');
    final prefs = await SharedPreferences.getInstance();
    final newCartId = await _createCart(prefs);
    await _saveCartToServer(newCartId, jwt);
    await _linkToCustomer(newCartId, jwt);
    return res.data['order'];
  }

  Future<String> _createCart(SharedPreferences prefs) async {
    final res = await _dio.post('$base/store/carts', data: {'region_id': regionId});
    final id = res.data['cart']['id'] as String;
    await prefs.setString('cart_id', id);
    return id;
  }

  Future<void> _saveCartToServer(String cartId, String jwt) async {
    try {
      await _dio.post('$base/store/cart/session',
          data: {'cart_id': cartId},
          options: Options(headers: {'Authorization': 'Bearer $jwt'}));
    } catch (_) {}
  }

  Future<void> _linkToCustomer(String cartId, String jwt) async {
    try {
      await _dio.post('$base/store/carts/$cartId/customer',
          options: Options(headers: {'Authorization': 'Bearer $jwt'}));
    } catch (_) {}
  }
}
```

---

## Edge Cases

| Situation | Solution |
|---|---|
| Cart 404 | Cart expired → create new cart + save to server |
| App reinstalled, not logged in | Create new guest cart |
| App reinstalled, logged in | `initCartAfterLogin` fetches from server |
| Same item added twice | MedusaJS auto-merges quantities ✅ |
| User A logout → User B login same device | User B gets their own server cart ✅ |
