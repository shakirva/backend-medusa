# MedusaJS API Coverage for RunBazaar Project

This document lists all relevant MedusaJS APIs (storefront and admin), their usage, and which custom APIs you need to build for full RunBazaar functionality. It also covers admin dashboard features required for your project.

---

## 1. MedusaJS Storefront APIs (Available Out-of-the-Box)

| API Endpoint                        | Method | Purpose / Usage                                      |
|--------------------------------------|--------|------------------------------------------------------|
| /store/products                      | GET    | List/search/filter products                          |
| /store/products/{id}                 | GET    | Get product details                                  |
| /store/categories                    | GET    | List categories                                      |
| /store/collections                   | GET    | List collections                                     |
| /store/carts                         | POST   | Create a new cart                                    |
| /store/carts/{id}                    | GET    | Get cart details                                     |
| /store/carts/{id}/line-items         | POST   | Add item to cart                                     |
| /store/carts/{id}/line-items/{item}  | DELETE | Remove item from cart                                |
| /store/carts/{id}/line-items/{item}  | POST   | Update item quantity                                 |
| /store/carts/{id}/complete           | POST   | Complete checkout (create order)                     |
| /store/orders                        | GET    | List customer orders                                 |
| /store/orders/{id}                   | GET    | Get order details                                    |
| /store/customers                     | POST   | Register customer                                    |
| /store/customers/me                  | GET    | Get current customer profile                         |
| /store/customers/me                  | POST   | Update customer profile                              |
| /store/customers/me/addresses        | POST   | Add address                                          |
| /store/customers/me/addresses/{id}   | DELETE | Remove address                                       |
| /store/auth                          | POST   | Customer login                                       |
| /store/auth                          | DELETE | Customer logout                                      |
| /store/regions                       | GET    | List regions (for shipping, currency, etc.)          |
| /store/shipping-options              | GET    | List shipping options for a cart                     |
| /store/payments                      | POST   | Initiate payment                                     |
| /store/discounts                     | GET    | List available discounts/coupons                     |
| /store/gift-cards                    | GET    | List available gift cards                            |
| /store/returns                       | POST   | Create a return request                              |
| /store/returns/{id}                  | GET    | Get return details                                   |

---

## 2. MedusaJS Admin APIs (Available Out-of-the-Box)

| API Endpoint                        | Method | Purpose / Usage                                      |
|--------------------------------------|--------|------------------------------------------------------|
| /admin/products                      | CRUD   | Manage products (add, edit, delete)                  |
| /admin/categories                    | CRUD   | Manage categories                                    |
| /admin/collections                   | CRUD   | Manage collections                                   |
| /admin/orders                        | CRUD   | Manage orders                                        |
| /admin/customers                     | CRUD   | Manage customers                                     |
| /admin/discounts                     | CRUD   | Manage discounts/coupons                             |
| /admin/gift-cards                    | CRUD   | Manage gift cards                                    |
| /admin/returns                       | CRUD   | Manage returns                                       |
| /admin/regions                       | CRUD   | Manage regions                                       |
| /admin/shipping-options              | CRUD   | Manage shipping options                              |
| /admin/payments                      | CRUD   | Manage payment providers                             |
| /admin/users                         | CRUD   | Manage admin users                                   |
| /admin/invites                       | CRUD   | Invite new admin users                               |
| /admin/uploads                       | POST   | Upload product images                                |
| /admin/store                         | GET    | Store settings                                       |

---

## 3. APIs You Need to Create (Custom)

| Feature / Page         | API Needed                | Notes |
|------------------------|--------------------------|-------|
| Brands                 | /store/brands, /admin/brands | Medusa does not support brands natively; create a module or use product tags as workaround |
| Wishlist/Saved         | /store/wishlist, /admin/wishlist | Custom module for customer wishlists |
| Reviews                | /store/reviews, /admin/reviews | Product reviews/ratings not in Medusa core |
| Seller Portal          | /admin/sellers, /store/sellers | Medusa is B2C; seller features require custom logic |
| Media Gallery          | /store/media, /admin/media | For product videos, galleries, etc. |
| Warranty               | /store/warranty, /admin/warranty | Custom module for warranty management |
| Mobile App Features    | /store/mobile, /admin/mobile | Push notifications, app-specific endpoints |
| Multi-language         | /store/i18n, /admin/i18n | i18n support for products, categories, etc. |
| Fast/Night Delivery    | /store/shipping/express, /admin/shipping/express | Custom shipping logic |
| Seller Registration    | /store/seller-register, /admin/seller-requests | For marketplace onboarding |
| Brand Pages            | /store/brands/{id}, /admin/brands/{id} | For brand-specific product listings |
| Customer Support/Chat  | /store/support, /admin/support | Integrate with external or custom chat/support system |

---

## 4. Admin Dashboard Features Needed

- Product, category, collection, and brand management
- Order, return, and refund management
- Customer management (profile, addresses, order history)
- Discount/coupon/gift card management
- Shipping and payment provider management
- Seller management (if marketplace)
- Review moderation (if reviews enabled)
- Media management (images, videos, galleries)
- Warranty/return policy management
- Multi-language content management
- Analytics and reporting (orders, sales, customers)
- User/admin role management
- Support ticket/chat management
- Store settings (logo, info, policies)

---

## 5. Recommendations
- Use MedusaJS admin dashboard for all standard e-commerce management.
- For each custom feature, extend Medusa with custom modules and admin UI components.
- Document all custom endpoints and keep API docs updated for frontend/mobile teams.

---

This file can be updated as your project grows. For each custom API, plan the data model, endpoints, and admin UI integration.
