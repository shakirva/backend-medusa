# Quick Start Guide - Start Development Today!

**Last Updated:** November 17, 2025

This guide will help you start developing custom APIs for your RunBazaar-style marketplace **immediately**.

---

## 🚀 TODAY'S SETUP (30 minutes)

### Step 1: Verify Your Environment

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store
yarn dev
```

✅ Should see: `Server is ready on port: 9000`

**Terminal 2 - Storefront:**
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store-storefront
yarn dev
```

✅ Should see: `Ready on http://localhost:8000`

**Terminal 3 - Commands:**
```bash
cd /Users/muhammedshakirva/Sygmetiv-works/marqa-souq/medusa/backend/my-medusa-store

# Create admin user (if not done)
yarn medusa user --email admin@marqasouq.com --password admin123

# Seed sample data
yarn seed
```

### Step 2: Verify Everything Works

1. **Admin Dashboard:**
   - Open: http://localhost:9000/app
   - Login: `admin@marqasouq.com` / `admin123`
   - Check: Can you see products, orders, customers?

2. **Storefront:**
   - Open: http://localhost:8000
   - Check: Can you see products, add to cart?

3. **API Test:**
   ```bash
   # Test products API
   curl http://localhost:9000/store/products
   
   # Should return JSON with products
   ```

✅ **If all above work, you're ready to develop!**

---

## 📅 WEEK 1 DETAILED PLAN

### Day 1 (Today): Brands API - Part 1

**Goal:** Create the Brands module structure and data model

**Tasks (4-5 hours):**

#### Task 1.1: Create Brands Module Structure (30 min)

```bash
cd backend/my-medusa-store/src/modules
mkdir -p brands/{models,api}
touch brands/index.ts
touch brands/service.ts
touch brands/models/brand.ts
```

#### Task 1.2: Define Brand Data Model (1 hour)

Create file: `src/modules/brands/models/brand.ts`

```typescript
import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  banner_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  display_order: model.number().default(0),
  created_at: model.dateTime().default("now"),
  updated_at: model.dateTime().default("now"),
})

export default Brand
```

#### Task 1.3: Create Brand Service (2 hours)

Create file: `src/modules/brands/service.ts`

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import Brand from "./models/brand"

class BrandService extends MedusaService({ Brand }) {
  
  // Create a new brand
  async createBrand(data: {
    name: string
    slug?: string
    description?: string
    logo_url?: string
    banner_url?: string
  }) {
    const slug = data.slug || this.generateSlug(data.name)
    
    // Check if slug already exists
    const existing = await this.listBrands({ slug })
    if (existing.length > 0) {
      throw new Error(`Brand with slug '${slug}' already exists`)
    }
    
    return await this.create({
      ...data,
      slug,
      is_active: true,
      display_order: 0,
    })
  }

  // Update brand
  async updateBrand(id: string, data: Partial<Brand>) {
    const brand = await this.retrieve(id)
    if (!brand) {
      throw new Error(`Brand with id '${id}' not found`)
    }
    
    return await this.update(id, {
      ...data,
      updated_at: new Date(),
    })
  }

  // Delete brand
  async deleteBrand(id: string) {
    return await this.delete(id)
  }

  // List all brands
  async listBrands(filters: any = {}) {
    return await this.list(filters, {
      order: { display_order: "ASC" },
    })
  }

  // Get brand by ID
  async getBrandById(id: string) {
    return await this.retrieve(id)
  }

  // Get brand by slug
  async getBrandBySlug(slug: string) {
    const brands = await this.list({ slug })
    return brands[0] || null
  }

  // Generate URL-friendly slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
  }
}

export default BrandService
```

#### Task 1.4: Register Module (30 min)

Create file: `src/modules/brands/index.ts`

```typescript
import { Module } from "@medusajs/framework/utils"
import BrandService from "./service"

export const BRAND_MODULE = "brandModuleService"

export default Module(BRAND_MODULE, {
  service: BrandService,
})
```

#### Task 1.5: Test the Module (1 hour)

Restart your backend server (Ctrl+C and `yarn dev` again)

Create test file: `src/scripts/test-brands.ts`

```typescript
import { MedusaApp } from "@medusajs/framework"

async function testBrands() {
  const { modules } = await MedusaApp({
    modulesConfig: {
      resolve: "./src/modules/brands",
    },
  })

  const brandService = modules.brandModuleService

  try {
    // Test: Create brand
    console.log("Creating brand...")
    const brand = await brandService.createBrand({
      name: "Apple",
      description: "Premium electronics and gadgets",
      logo_url: "https://example.com/apple-logo.png",
    })
    console.log("✅ Brand created:", brand)

    // Test: List brands
    console.log("\nListing brands...")
    const brands = await brandService.listBrands()
    console.log("✅ Total brands:", brands.length)

    // Test: Get by slug
    console.log("\nGetting brand by slug...")
    const appleBySlug = await brandService.getBrandBySlug("apple")
    console.log("✅ Found brand:", appleBySlug?.name)

    // Test: Update brand
    console.log("\nUpdating brand...")
    const updated = await brandService.updateBrand(brand.id, {
      description: "Updated description",
    })
    console.log("✅ Brand updated")

    console.log("\n✅ All tests passed!")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testBrands()
```

Run test:
```bash
npx ts-node src/scripts/test-brands.ts
```

---

### Day 2: Brands API - Part 2 (Store & Admin Routes)

**Goal:** Create API endpoints for storefront and admin

#### Task 2.1: Store API Routes (2 hours)

Create directory structure:
```bash
mkdir -p src/api/store/brands/[id]
```

Create file: `src/api/store/brands/route.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../modules/brands"

// GET /store/brands
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  
  try {
    const brands = await brandService.listBrands({
      is_active: true,
    })
    
    res.json({
      brands,
      count: brands.length,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching brands",
      error: error.message,
    })
  }
}
```

Create file: `src/api/store/brands/[id]/route.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../../modules/brands"

// GET /store/brands/:id
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  
  try {
    // Try as ID first, then as slug
    let brand = await brandService.getBrandById(id)
    
    if (!brand) {
      brand = await brandService.getBrandBySlug(id)
    }
    
    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      })
    }
    
    // TODO: Fetch products for this brand
    // const products = await productService.list({ brand_id: brand.id })
    
    res.json({
      brand,
      // products,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching brand",
      error: error.message,
    })
  }
}
```

#### Task 2.2: Admin API Routes (2 hours)

Create directory structure:
```bash
mkdir -p src/api/admin/brands/[id]
```

Create file: `src/api/admin/brands/route.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../modules/brands"

// GET /admin/brands
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  
  try {
    const { is_active } = req.query
    
    const filters: any = {}
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true'
    }
    
    const brands = await brandService.listBrands(filters)
    
    res.json({
      brands,
      count: brands.length,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching brands",
      error: error.message,
    })
  }
}

// POST /admin/brands
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  
  try {
    const brand = await brandService.createBrand(req.body)
    
    res.status(201).json({
      brand,
    })
  } catch (error) {
    res.status(400).json({
      message: "Error creating brand",
      error: error.message,
    })
  }
}
```

Create file: `src/api/admin/brands/[id]/route.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BRAND_MODULE } from "../../../../modules/brands"

// GET /admin/brands/:id
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  
  try {
    const brand = await brandService.getBrandById(id)
    
    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      })
    }
    
    res.json({ brand })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching brand",
      error: error.message,
    })
  }
}

// PUT /admin/brands/:id
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  
  try {
    const brand = await brandService.updateBrand(id, req.body)
    
    res.json({ brand })
  } catch (error) {
    res.status(400).json({
      message: "Error updating brand",
      error: error.message,
    })
  }
}

// DELETE /admin/brands/:id
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { id } = req.params
  
  try {
    await brandService.deleteBrand(id)
    
    res.status(204).send()
  } catch (error) {
    res.status(400).json({
      message: "Error deleting brand",
      error: error.message,
    })
  }
}
```

#### Task 2.3: Test API Endpoints (1 hour)

Restart backend and test with curl:

```bash
# Test Store API
curl http://localhost:9000/store/brands

# Test Admin API - Create Brand
curl -X POST http://localhost:9000/admin/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Samsung",
    "description": "Innovative technology and electronics",
    "logo_url": "https://example.com/samsung-logo.png"
  }'

# Test Admin API - List Brands
curl http://localhost:9000/admin/brands \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test Admin API - Get Brand
curl http://localhost:9000/admin/brands/BRAND_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test Admin API - Update Brand
curl -X PUT http://localhost:9000/admin/brands/BRAND_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Updated description"
  }'

# Test Admin API - Delete Brand
curl -X DELETE http://localhost:9000/admin/brands/BRAND_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### Day 3: Wishlist API Implementation

Follow similar pattern as Brands API:
1. Create module structure
2. Define data models (Wishlist, WishlistItem)
3. Implement service layer
4. Create API routes
5. Test endpoints

---

### Day 4: Documentation & Testing

1. Create Postman collection
2. Write API documentation
3. Add unit tests
4. Code review

---

### Day 5: Week 1 Review

1. Demo to team
2. Gather feedback
3. Plan Week 2 (Reviews & Seller Portal)

---

## 🔧 TROUBLESHOOTING

### Issue: Module not found

**Solution:**
```bash
# Restart backend
cd backend/my-medusa-store
yarn dev
```

### Issue: Database error

**Solution:**
```bash
# Run migrations
yarn medusa migrations run

# Or reset database
yarn medusa db:reset
```

### Issue: Port already in use

**Solution:**
```bash
# Kill process on port 9000
lsof -ti:9000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

---

## 📚 RESOURCES

**MedusaJS Documentation:**
- Modules: https://docs.medusajs.com/learn/customization/custom-features/module
- API Routes: https://docs.medusajs.com/learn/customization/custom-features/api-route
- Data Models: https://docs.medusajs.com/learn/data-models

**Project Documentation:**
- Complete Plan: `docs/COMPLETE_PROJECT_PLAN.md`
- API Coverage: `docs/medusajs-api-coverage.md`

---

## ✅ DAILY CHECKLIST

```
Morning:
□ Pull latest code (git pull)
□ Start backend (yarn dev)
□ Start storefront (yarn dev)
□ Check admin dashboard

During Development:
□ Write code
□ Test locally
□ Write tests
□ Update documentation

Before Commit:
□ All tests pass
□ Code formatted
□ No console errors
□ Documentation updated

End of Day:
□ Commit changes
□ Push to branch
□ Update task tracker
□ Plan tomorrow's work
```

---

## 📞 NEED HELP?

- **MedusaJS Discord:** https://discord.gg/medusajs
- **Documentation:** https://docs.medusajs.com
- **Team Slack:** #marqa-souq-dev
- **Project Wiki:** [Your wiki link]

---

**Good luck! Let's build something amazing! 🚀**
