# RunBazaar Feature to MedusaJS API Mapping

| Feature / Page                | MedusaJS API Endpoint(s)                        | Custom Needed? | Notes |
|------------------------------|-------------------------------------------------|---------------|-------|
| Home                         | /store/products, /store/categories              | No            | Use for featured, new, deals, etc. |
| Categories                   | /store/categories                               | No            | Medusa supports categories out of the box |
| Brands                       | N/A                                             | Yes           | Requires custom module or product tag workaround |
| Product Listing              | /store/products                                 | No            | Supports filters, search, pagination |
| Product Details              | /store/products/{id}                            | No            | Images, variants, specs supported |
| Cart                         | /store/carts, /store/carts/{id}                 | No            | Add/update/remove items |
| Checkout                     | /store/carts/{id}/complete, /store/orders       | No            | Address, shipping, payment flows |
| Saved/Wishlist               | N/A                                             | Yes           | Needs custom implementation |
| User Account/Profile         | /store/customers, /store/addresses, /store/orders| No           | Registration, login, profile, addresses |
| Order History                | /store/orders                                   | No            | List and view orders |
| Returns/Warranty             | /store/returns                                  | Partial       | Warranty is custom, returns supported |
| Coupons/Offers               | /store/discounts, /store/gift-cards             | No            | Apply at cart/checkout |
| Reviews                      | N/A                                             | Yes           | Needs custom implementation |
| Media Gallery                | N/A                                             | Yes           | Product images supported, gallery is custom |
| Seller Portal                | N/A                                             | Yes           | Medusa is B2C, seller features are custom |
| Support/Help Center          | N/A                                             | No            | Static pages or CMS integration |
| Blog                         | N/A                                             | No            | Static or CMS integration |
| About/Terms/Privacy          | N/A                                             | No            | Static pages |
| Order Tracking               | /store/orders/{id}                              | No            | Order status, shipment info |
| Mobile App Features          | N/A                                             | Yes           | Push notifications, app links, etc. |
| Multi-language               | N/A                                             | Yes           | Needs i18n setup |
| Payment Methods              | /store/payments                                 | No            | Online, cash on delivery (COD plugin) |
| Shipping/Delivery            | /store/shipping-options, /store/orders          | No            | Shipping methods, delivery info |
| Seller Registration          | N/A                                             | Yes           | Custom APIs |
| Brand Pages                  | N/A                                             | Yes           | Custom or via product tags |
| Recommended Products         | /store/products?filter=...                      | No            | Use tags, categories, or custom logic |
| Fast/Night Delivery          | /store/shipping-options                         | Partial       | Custom shipping logic may be needed |
| Buyer Protection             | N/A                                             | No            | Static info |
| Warranty                     | N/A                                             | Yes           | Custom module |
| Customer Support             | N/A                                             | No            | Static or external integration |

## Legend
- **No**: Supported by MedusaJS out of the box
- **Partial**: Some support, but may need extension
- **Yes**: Requires custom API/module

---

This table can be expanded as you discover more features or as your project grows. For each "Custom Needed? = Yes", you will need to design and implement new endpoints or modules in your MedusaJS backend.