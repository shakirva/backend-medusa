

## 1.  Products from Collection/Category — Free Delivery & Night Delivery Param

**Current API for category products:**
```
GET /store/categories/{handle}/products?sort=price_asc&page=1&limit=20&currency=kwd
```

>  The `free_delivery` and `night_delivery` params are **business/shipping logic — not currently stored as product fields**.
>
> Please use **static/mock values** on your side for now.
> I will add these as product metadata fields and notify you when ready.

---

## 2.  Profile Screen — Help Center (Sections + Q&A)

**Currently available static pages API:**
```
GET /store/pages
GET /store/pages/{slug}
```

**Available slugs:**
| Slug | Content |
|------|---------|
| `about` | About MarqaSouq |
| `privacy-policy` | Privacy Policy |
| `terms-and-conditions` | Terms & Conditions |
| `return-policy` | Return Policy |
| `shipping-policy` | Shipping Policy |
| `contact-us` | Contact Us |

>  A dedicated **Help Center with sections and Q&A is not yet implemented**.
>
> Please confirm if you need it as a separate API endpoint and I will build it.

---

## 3.  Profile Screen — User Points, Balance, Transactions & Level

**Current profile endpoint:**
```
GET /store/customers/me
Authorization: Bearer {token}
```

>  **User points, balance, transactions, and loyalty level are NOT yet implemented.**
>
> Please use **placeholder/mock values** on your side for now.
> I will notify you when the loyalty/wallet API is ready.

---

## 4.  Profile Screen — Logout → Login Goes to Signup (Previous Account Not Accessible)

>  This is a **Flutter-side session management issue — not an API problem.**

The API uses JWT tokens. When the user logs in again with the same email and password, the **same account is returned** with all previous data (orders, addresses, etc.).

**Login endpoint:**
```
POST /auth/customer/emailpass
Content-Type: application/json

Body:
{
  "email": "customer@example.com",
  "password": "yourpassword"
}
```

**Action required on Flutter side:**
- On **logout** → only **delete the JWT token** from local storage
- Do **NOT** delete `customer_id`, `cart_id`, or any other customer data locally
- On re-login → the same account with all history will come back, and you will get a **new JWT token**

> ⚠️ **Important:** The JWT token is only needed **after** the user re-logs in. You do NOT need a JWT to store or read `cart_id` locally — `cart_id` is just a plain string stored in `SharedPreferences`, not protected by JWT. The JWT is only required when making **API calls**. So logout = clear JWT → after re-login = get a new JWT → use it for API calls.

**Correct logout flow:**
```dart
// On logout:
SharedPreferences prefs = await SharedPreferences.getInstance();
await prefs.remove('jwt_token');       // ✅ Remove only the JWT
// Do NOT remove 'cart_id'             // ✅ Keep cart_id for re-association after login
// Do NOT remove 'customer_id'         // ✅ Optional to keep for reference
```

**On re-login:**
```dart
// Step 1: Login → get new JWT
final response = await dio.post('/auth/customer/emailpass', data: {
  "email": email,
  "password": password,
});
final newJwt = response.data['token'];
await prefs.setString('jwt_token', newJwt);  // ✅ Save new JWT

// Step 2: Re-associate cart (see Point 5 below)
```

---

## 5.  Profile Screen — Cart ID Needed, Previous Cart Not Available After Re-Login

>  This is expected MedusaJS behavior. Carts are session-based.

**How it actually works:**

| What gets cleared on logout | What stays |
|---|---|
| JWT token (you clear it) | `cart_id` (stays in `SharedPreferences`) |
| Server session | Cart items in DB (linked to `cart_id`) |

> ✅ The **`cart_id` is stored in `SharedPreferences` on the device** — it does NOT require a JWT to read from local storage. On logout you only remove the JWT. The `cart_id` string is still there on the device after logout.

**After re-login, re-associate the cart with the new JWT:**

**Step 1 — `cart_id` is already in local storage (you saved it when creating the cart):**
```dart
SharedPreferences prefs = await SharedPreferences.getInstance();
final cartId = prefs.getString('cart_id'); // ✅ This is still there after logout
```

**Step 2 — After re-login, use the NEW JWT to re-associate the cart:**
```
POST /store/carts/{cart_id}/customer
Authorization: Bearer {new_jwt_token}
```
```dart
// After re-login and getting new JWT:
if (cartId != null) {
  await dio.post(
    '/store/carts/$cartId/customer',
    options: Options(headers: {'Authorization': 'Bearer $newJwt'}),
  );
  // ✅ Cart is now linked to the logged-in customer
}
```

> ✅ This works because:
> - `cart_id` → read from local device storage (no JWT needed to read it)
> - `POST /store/carts/{id}/customer` → uses the **new JWT** you just got after re-login
>
> ⚠️ If the cart has expired (cart older than ~7 days server-side), you must create a new one:
> ```dart
> final newCart = await createCart(); // POST /store/carts
> await prefs.setString('cart_id', newCart['cart']['id']);
> ```

---

## 6.  Profile Screen — Overall App Reviews in Quick Access Section

>  **Overall app-level review/rating is NOT currently implemented.**

For **product reviews**, use:
```
GET /store/products/{id}/reviews
```

For the **overall app rating**, please use a **static/mock value** for now.
I will build a dedicated endpoint and notify you.

---

## 7.  Profile Screen — RB Card Zone — Post Review for Whole Application

>  **App-level review submission is NOT yet implemented.**

For **product-level review submission**, use:
```
POST /store/products/{id}/reviews
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "rating": 5,
  "title": "Great product!",
  "content": "Really happy with this purchase."
}
```

> Please confirm the **UI design / fields required** for app-level review so I can build the correct data structure.

---

## 8.  Category Filter Screen — 500 Error

**Failing URL (DO NOT USE):**
```
/store/products?limit=20&offset=0&order=price_asc&category_id=pcat_01KJA1VNT80560CM70WZ71TWVJ&region_id=reg_01KAARY0EYGZY423VSZV7DVX25
```

>  The default Medusa `/store/products` endpoint does **NOT support** `order=price_asc` — this causes the **500 error**.

** Use our custom category API instead:**
```
GET /store/categories/{handle}/products?sort=price_asc&page=1&limit=20&currency=kwd
```

**Supported `sort` values:**
| Value | Description |
|-------|-------------|
| `newest` | Newest first (default) |
| `oldest` | Oldest first |
| `price_asc` | Price: Low to High |
| `price_desc` | Price: High to Low |
| `title_asc` | Name A–Z |
| `title_desc` | Name Z–A |

**How to get the category handle from a category ID:**
```
GET /store/categories/tree
```
Find the entry with `id = pcat_01KJA1VNT80560CM70WZ71TWVJ` and use its `handle` field.

**Example with all filters:**
```
GET /store/categories/phone-cases/products?sort=price_asc&page=1&limit=20&currency=kwd&min_price=1&max_price=50&brand=Levelo&in_stock=true
```

---

## 9.  Product Details API — Missing Fields

**Full product details endpoint:**
```
GET /store/products/{id}/details?currency=kwd
```

**Status of each requested field:**

| Field | Status | How to Get |
|-------|--------|------------|
| `is_wishlist` |  Available | `GET /store/wishlist` (auth required) — check if `product_id` exists in the returned items list |
| `warranty` |  Available | `GET /store/warranty?email={customer_email}` — filter by `product_id` |
| `deliver_by_date` |  Not yet built | Will add — needs business logic |
| `delivery_charges` |  Not yet built | Depends on region/shipping config — will add |
| `payment_method_options` |  Not yet built | Will add to store config API |
| `size` & `colour` / variants |  Available | `GET /store/products/{id}/details` → `variants` array with `options` |

**How to check `is_wishlist` on Flutter side:**

> ⚠️ **Do NOT use the loop approach** — fetching all 50+ wishlist items and iterating through them on the client is slow and bad UX (1 min loader).

**✅ Use the dedicated single-product check endpoint instead:**
```
GET /store/wishlist/check?product_id={product_id}
Authorization: Bearer {customer_token}
```

**Response (instant, single DB lookup):**
```json
{
  "is_wishlisted": true,
  "item_id": "witem_01ABC123"
}
```

**Flutter code:**
```dart
Future<Map<String, dynamic>> checkWishlist(String productId) async {
  final response = await dio.get(
    '/store/wishlist/check',
    queryParameters: {'product_id': productId},
    options: Options(headers: {'Authorization': 'Bearer $jwt'}),
  );
  return response.data;
  // { "is_wishlisted": true/false, "item_id": "witem_xxx" or null }
}

// On Product Detail screen:
final result = await checkWishlist(productId);
final isWishlisted = result['is_wishlisted'];  // true/false
final itemId = result['item_id'];              // needed for DELETE /store/wishlist/items/{item_id}
```

> ✅ This checks **only the specific product** in the DB — no full list fetch, instant response.
> - If `is_wishlisted = true` → show filled heart icon, store `item_id`
> - To remove from wishlist: `DELETE /store/wishlist/items/{item_id}`
> - To add to wishlist: `POST /store/wishlist/items` with `{ "product_id": "..." }`

**Variants / Size / Colour response structure:**
```json
{
  "variants": [
    {
      "id": "variant_01ABC",
      "sku": "CASE-BLK-001",
      "options": [
        { "option": "Color", "value": "Black" },
        { "option": "Size", "value": "iPhone 17 Pro" }
      ],
      "price": 12.900,
      "currency_code": "kwd",
      "in_stock": true
    }
  ]
}
```

---

## 10.  Media & Gallery — Videos + Suggested Products

| Feature | Status | Notes |
|---------|--------|-------|
| Product Images |  Available | In `GET /store/products/{id}/details` → `images[]` array |
| Product Videos |  Not implemented | Please confirm: will videos come from **Odoo** or be manually uploaded? I will add `video_url` field to product metadata once confirmed |
| Suggested Products |  Available | In `GET /store/products/{id}/details` → `related_products[]` array (same category) |

---
