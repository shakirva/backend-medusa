# 🤖 Copilot Prompt for MarqaSouq Project

Copy-paste this prompt when starting a new Copilot session to give it full context:

---

## THE PROMPT:

```
I am working on MarqaSouq — an e-commerce marketplace for electronics in Kuwait.

## Tech Stack:
- **Backend**: MedusaJS 2.x (Node.js, TypeScript) on port 9000
- **Frontend**: Next.js 15 (React, JavaScript) on port 3000
- **Database**: PostgreSQL 14 on port 5432
- **ERP**: Odoo (source of ALL products, images, inventory, prices)
- **DB**: postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev
- **Target Market**: Kuwait (KWD currency)
- **No S3 needed**: All product images come from Odoo, not stored locally

## Important Rules:
1. MedusaJS 2.x uses Knex (NOT raw pg). PG_CONNECTION is a Knex instance.
   - Use `.raw("SELECT ... WHERE id = ?", [value])` — NOT `$1` placeholders
   - Resolve via: `req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)`
   - Import: `import { ContainerRegistrationKeys } from "@medusajs/framework/utils"`

2. ALL product data comes from Odoo ERP. Never create products from admin dashboard.

3. MedusaJS 2.x table schemas (critical):
   - `order_line_item` has NO `quantity` or `order_id` column
   - JOIN through `order_item` table: order → order_item → order_line_item
   - `product_sales_channel` requires `id` (prefix: prodsc_), `created_at`, `updated_at`

4. Frontend image handling:
   - Product images stored as relative paths: `/static/uploads/products/...`
   - Use `safeImageFor()` from `lib/medusa.js` to convert to absolute URLs
   - Use `unoptimized` prop on Next.js `<Image>` component for backend images

5. Sales Channel ID: `sc_01KAARXK1AS8RHX8SQ6Z8J520X`

## Workspace Structure:
- Backend: backend/my-medusa-store/
  - APIs: src/api/store/ (17 routes), src/api/admin/ (17 routes), src/api/odoo/ (4 routes)
  - Modules: src/modules/ (blog, brands, media, odoo-sync, reviews, sellers, warranty, wishlist)
- Frontend: frontend/markasouq-web/
  - Pages: src/app/[lang]/ (30+ pages)
  - Components: src/components/
  - API Client: src/lib/medusa.js

## Current Status:
- 2172 products, 267 categories, 9 collections
- Region: Kuwait (KWD) — this is the only target market
- Images: Come from Odoo (no S3 needed)
- Payment: Only 1 basic provider — need KNET or Stripe

## Git Repos:
- Backend: https://github.com/shakirva/backend-medusa.git (main)
- Frontend: https://github.com/Zahidmk/markasouq-web.git

When I ask you to fix something, be direct and quick. Don't over-explain.
Always use Knex syntax (?) for database queries, never $1/$2.
Keep code simple — this needs to launch in 3 days.
```

---

## SHORTER VERSION (if you need a quick context):

```
MarqaSouq e-commerce: MedusaJS 2.x backend (port 9000) + Next.js frontend (port 3000) + PostgreSQL + Odoo ERP.

CRITICAL: PG_CONNECTION is Knex — use `.raw("...WHERE id = ?", [val])` not $1.
Resolve: `req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)`
Import: `import { ContainerRegistrationKeys } from "@medusajs/framework/utils"`

Products come from Odoo sync, NOT admin. 2172 products, 267 categories.
Sales Channel: sc_01KAARXK1AS8RHX8SQ6Z8J520X
Images: come from Odoo (no S3). Use safeImageFor() + unoptimized prop on <Image>.
Target: Kuwait market (KWD currency). No S3 needed.
Backend: backend/my-medusa-store/
Frontend: frontend/markasouq-web/
```
