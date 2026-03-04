# Homepage Feature Contract

Last updated: 2025-12-22
Authors: frontend/backend

Purpose
-------
This document defines the contract (data shapes, APIs, acceptance criteria) required to implement a fully-dynamic homepage whose content is manageable from the admin dashboard.

High-level inputs / outputs (contract)
------------------------------------
- Input (Admin): CRUD operations to create sections and assign products/images/links. Each section can be localized (en/ar).
- Input (Backend): Product records, media storage, collections/categories.
- Output (API): GET /storefront/homepage?locale={locale} returns a JSON payload describing an ordered list of homepage sections with typed content (banners, product lists, category cards).
- Output (Frontend): Rendered homepage (SSR where possible) with components consuming the API payload.
- Errors: If homepage backend errors, frontend should show graceful fallback UI and log the issue. Missing images must not cause 500s.

Key non-functional requirements
-------------------------------
- Locale-aware: support `/en` and `/ar` routes. API must accept a `locale` parameter and respond with localized content when present.
- Cacheable: homepage JSON should be cacheable with short TTL and invalidatable after admin edits.
- Secure: admin APIs require auth. Public storefront endpoint is read-only and rate-limited.
- Resilient: image 404s should show placeholders; missing section data should be skipped (not crash page).

Data models (suggested)
------------------------
1) Banner
- id: string
- title: string | localized object { en, ar }
- subtitle: string | localized
- image: url
- link: url (internal page /product/:id, /category/:slug or external)
- alt_text: string | localized
- priority: number (higher first)
- active: boolean
- start_at: datetime | nullable
- end_at: datetime | nullable
- locale: string | null (null = all locales)

2) Section
- id: string
- type: string ("banner", "product_grid", "host_deals", "best_in_category", "recommended", "category_cards", "custom_html")
- title: string | localized
- subtitle: string | localized
- settings: json (type-specific settings: grid columns, carousel autoplay, product_count)
- items: [SectionItem]
- priority: number
- active: boolean
- locale: string | null

3) SectionItem
- id: string
- type: string ("product", "static_card", "external_link", "category")
- product_id: string | null
- image: url | null
- title: string | localized
- link: url | null
- meta: json (freeform for future)
- order: number

4) FeaturedCollection (optional)
- id, title, product_ids[], locale, active

API contract
------------
GET /storefront/homepage?locale={locale}
- Purpose: return ordered list of active sections for the homepage for the requested locale.
- Response: 200

Example response (abridged):

{
  "locale": "en",
  "generated_at": "2025-12-22T09:00:00Z",
  "sections": [
    {
      "id": "s_hero",
      "type": "banner",
      "title": { "en": "Welcome", "ar": "مرحبا" },
      "settings": { "carousel": true, "autoplay": true },
      "items": [
        { "id": "b1", "type": "banner", "image": "https://.../hero-1.avif", "link": "/en/products/1", "alt_text": {"en":"...","ar":"..."} }
      ]
    },
    {
      "id": "s_deals",
      "type": "host_deals",
      "title": {"en":"Host Deals","ar":"عروض المضيف"},
      "settings": {"columns": 4},
      "items": [
        { "id":"si1","type":"product","product_id":"prod_123","order":1 }
      ]
    }
  ]
}

Error responses
- 500: internal error. Frontend fallback should be used.
- 400: invalid query param (rare).

Frontend contracts / component inputs
-------------------------------------
Each component receives a `section` object (see API response) and must render defensively.
- HeroCarouselComponent: expects section.type === 'banner', section.items = array of banners.
- ProductGridComponent: expects items of type 'product' with product_id; the frontend may perform a product-details fetch if items do not include denormalized product fields.
- BestInCategoryComponent: expects settings.collection_id or items with product references.

Acceptance criteria (per section)
---------------------------------
1) Hero banners (banner)
- Admin can add 1..N banners with image, link, alt text and localized title.
- Frontend shows carousel on top of homepage, responsive images and correct link behavior.
- Missing image => placeholder; invalid link => open homepage root.

2) Host Deals (host_deals)
- Admin can create a deals section and attach products and optionally set a countdown (start/end times).
- Frontend shows discount badges, computed price, and active countdown when time-bound.

3) Best-in-category (best_in_category)
- Admin picks a category/collection or explicit products.
- Frontend displays top N products (configurable), shows product name, price and CTA.

4) Recommended products (recommended)
- If personalization API available, accept personalized product ids for logged-in user.
- Else, fallback to admin-curated list.

5) Category cards
- Admin creates category card items with image + label + link.
- Frontend displays cards and navigates to category listing.

Admin UI requirements
---------------------
- Ability to create and reorder sections.
- Create section items and assign existing products (search by name/sku).
- Localize title/subtitle/alt text.
- Toggle `active` and schedule start/end dates.

Seeding and migration
---------------------
- Provide an idempotent seed script that creates default: hero banners (3), host deals (4 products), best_in_powerbanks (4) and best_in_laptops (4), category cards (6).
- If product ids referenced by seed are missing, seed does not fail; it logs and continues.

Caching and invalidation
------------------------
- Cache homepage JSON on backend for TTL=60s (configurable).
- When admin updates any section, call cache invalidation (or increment version tag) so frontend gets latest content.

Localization behavior
---------------------
- If section.locale is null, it is shown for all locales.
- Localized fields are objects { en, ar }.
- If content missing for requested locale, fallback first to global (null locale), then to `en`.

Edge cases and rules
--------------------
- Sections with no active items are skipped on the frontend.
- Product references should be validated: if missing, show placeholder card with "Product unavailable".
- Image load failures must render fallback and not crash server.

Testing
-------
- Unit tests for API: ensure /storefront/homepage returns expected JSON shape for locales.
- Integration tests: admin flow to create section and confirm storefront returns it.
- Frontend smoke tests: homepage renders hero banners and at least 1 product grid.

Security
--------
- Admin endpoints: authenticated + RBAC.
- Storefront homepage endpoint: read-only, rate limited.

Example implementation notes (minimum viable)
--------------------------------------------
- Backend: add `homepage_sections` and `homepage_items` tables with columns matching data model. Provide a simple controller returning denormalized JSON (sections + items).
- Admin: small CRUD page integrated into existing admin UI (reuse product picker).
- Frontend: server-component for homepage that calls GET /storefront/homepage?locale available in `markasouq-web` and renders the top sections; components lazy-load heavy interactive pieces.

Next steps & estimates (for single dev)
---------------------------------------
- Write seed & backend models: 2-3 hours
- Admin CRUD UI (basic): 2-3 hours
- Frontend integration + hero banners: 1.5-2 hours
- Host deals + best-in sections: 2 hours
- QA & tests: 1.5 hours
Total estimate: ~9–12 hours (can be trimmed by focusing on minimal admin UI and manual seeding to speed delivery).

Appendix: Minimal JSON Schema (short)
------------------------------------
Section (brief JSON schema):
{
  "id": "string",
  "type": "string",
  "title": {"en":"string","ar":"string"},
  "settings": {},
  "items": [{ "id":"string","type":"product|banner|category","product_id":"string","image":"url","order":1 }]
}

---
If you want, I can now:
- implement the minimal backend endpoint and seed (task 2/5), or
- create the admin CRUD pages (task 3), or
- implement the frontend data layer + hero banners (tasks 6/7).

Tell me which one to start and I will mark it as in-progress and begin implementing.
