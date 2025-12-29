import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// Admin-side route-level validation for product create/update
// Controlled by env var REQUIRE_PRODUCT_METADATA (string 'true' enables enforcement).
// When enabled, requests creating products must include at least one of:
// - tags: non-empty array
// - collection_id or collection_ids: single or array
// - categories: non-empty array

function hasMetadata(payload: any) {
  if (!payload || typeof payload !== 'object') return false
  const hasTags = Array.isArray(payload.tags) && payload.tags.length > 0
  const hasCollectionId = !!payload.collection_id
  const hasCollectionIds = Array.isArray(payload.collection_ids) && payload.collection_ids.length > 0
  const hasCategories = Array.isArray(payload.categories) && payload.categories.length > 0
  return hasTags || hasCollectionId || hasCollectionIds || hasCategories
}

const metadataError = {
  message:
    'Missing required metadata: please include tags OR collection_id/collection_ids OR categories in the product payload.\n' +
    'Set REQUIRE_PRODUCT_METADATA=false to disable this check (e.g., during bulk import).',
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    const requireMetadata = process.env.REQUIRE_PRODUCT_METADATA === 'true'

    if (requireMetadata && !hasMetadata(body)) {
      return res.status(400).json(metadataError)
    }

    const productService = req.scope.resolve(Modules.PRODUCT) as any

    // Try common create method names used across Medusa versions/customizations
    let created: any = null
    if (typeof productService.create === 'function') {
      created = await productService.create(body)
    } else if (typeof productService.createProduct === 'function') {
      created = await productService.createProduct(body)
    } else if (typeof productService.createProducts === 'function') {
      created = await productService.createProducts(body)
    } else {
      console.error('Product service create method not found on service:', Object.keys(productService || {}))
      return res.status(500).json({ message: 'Product create method not found on product service' })
    }

    return res.json({ product: created })
  } catch (e: any) {
    console.error('Admin product create error:', e)
    return res.status(500).json({ message: e?.message || 'Failed to create product' })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    // id may come from query param (e.g., /admin/products?id=prod_...) or body
    const id = (req.query && (req.query.id as string)) || body?.id
    if (!id) return res.status(400).json({ message: 'Missing product id for update' })

    const requireMetadata = process.env.REQUIRE_PRODUCT_METADATA === 'true'

    // If the update payload would remove metadata (or leave it empty), enforce presence
    if (requireMetadata) {
      // We require either the incoming payload includes metadata OR that metadata already exists.
      // To keep this lightweight (avoid an extra DB read in the common case), we primarily enforce
      // that the update payload includes at least one metadata field when REQUIRE_PRODUCT_METADATA is true.
      if (!hasMetadata(body)) {
        return res.status(400).json(metadataError)
      }
    }

    const productService = req.scope.resolve(Modules.PRODUCT) as any

    // Try a few common update method names
    let updated: any = null
    if (typeof productService.updateProducts === 'function') {
      updated = await productService.updateProducts(id, body)
    } else if (typeof productService.updateProduct === 'function') {
      updated = await productService.updateProduct(id, body)
    } else if (typeof productService.update === 'function') {
      updated = await productService.update(id, body)
    } else {
      console.error('Product service update method not found on service:', Object.keys(productService || {}))
      return res.status(500).json({ message: 'Product update method not found on product service' })
    }

    return res.json({ product: updated })
  } catch (e: any) {
    console.error('Admin product update error:', e)
    return res.status(500).json({ message: e?.message || 'Failed to update product' })
  }
}
