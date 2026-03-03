import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import OdooSyncService from "../../../../modules/odoo-sync/service"
import * as fs from "fs"
import * as path from "path"

/**
 * POST /odoo/webhooks/products
 * 
 * Real-time webhook for Odoo to push product create/update/delete events.
 * 
 * Configure an Odoo Automated Action on product.template to call this
 * endpoint whenever a product is created, updated, or deleted.
 * 
 * Request body:
 * {
 *   "event_type": "product.created" | "product.updated" | "product.deleted",
 *   "webhook_secret": "your-shared-secret",
 *   "product": {
 *     "odoo_id": 123,           // product.template ID (required)
 *     // ... optional overrides, or we re-fetch from Odoo
 *   }
 * }
 */

const WEBHOOK_SECRET = process.env.ODOO_WEBHOOK_SECRET || ""
const IMAGE_DIR = path.join(process.cwd(), "static", "uploads", "products")

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100)
}

function toSmallestUnit(amount: number): number {
  return Math.round(amount * 1000) // KWD uses 3 decimal places
}

async function saveBase64Image(base64Data: string, filename: string): Promise<string | null> {
  try {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true })
    const buffer = Buffer.from(base64Data, "base64")
    fs.writeFileSync(path.join(IMAGE_DIR, filename), buffer)
    return `/static/uploads/products/${filename}`
  } catch {
    return null
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const { event_type, webhook_secret, product: productData } = req.body as {
    event_type: "product.created" | "product.updated" | "product.deleted"
    webhook_secret?: string
    product: {
      odoo_id: number
      [key: string]: any
    }
  }

  // ── Validate ──
  if (!event_type || !productData?.odoo_id) {
    return res.status(400).json({
      type: "invalid_data",
      message: "event_type and product.odoo_id are required",
    })
  }

  // ── Auth (optional shared secret) ──
  if (WEBHOOK_SECRET && webhook_secret !== WEBHOOK_SECRET) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Invalid webhook_secret",
    })
  }

  const odooId = productData.odoo_id
  console.log(`[Odoo Webhook] ${event_type} for product template ID: ${odooId}`)

  try {
    // ── DELETE event ──
    if (event_type === "product.deleted") {
      // Find Medusa product by odoo_id in metadata
      const existing = await productService.listProducts(
        { metadata: { odoo_id: odooId } } as any,
        { select: ["id", "title"], take: 1 }
      )

      if (existing.length > 0) {
        await productService.deleteProducts([existing[0].id])
        console.log(`[Odoo Webhook] ✅ Deleted product: ${existing[0].title} (${existing[0].id})`)
        return res.status(200).json({
          status: "success",
          action: "deleted",
          medusa_product_id: existing[0].id,
        })
      }

      return res.status(200).json({
        status: "not_found",
        message: `No Medusa product found for Odoo ID ${odooId}`,
      })
    }

    // ── CREATE / UPDATE — Fetch full product from Odoo ──
    const odoo = new OdooSyncService()
    if (!odoo.isConfigured()) {
      return res.status(500).json({
        type: "configuration_error",
        message: "Odoo is not configured on the backend",
      })
    }

    const odooProduct = await odoo.fetchProductById(odooId)
    if (!odooProduct) {
      return res.status(404).json({
        type: "not_found",
        message: `Product template ${odooId} not found in Odoo`,
      })
    }

    // Resolve brand
    let brandName: string | null = null
    if (odooProduct.brand_id && Array.isArray(odooProduct.brand_id)) {
      brandName = odooProduct.brand_id[1]
    } else if (odooProduct.x_studio_brand_1) {
      brandName = odooProduct.x_studio_brand_1 as string
    }

    // Resolve ribbon
    let ribbonText: string | null = null
    if (odooProduct.website_ribbon_id && Array.isArray(odooProduct.website_ribbon_id)) {
      ribbonText = odooProduct.website_ribbon_id[1]
    }

    // Convert to Medusa format
    const medusaData = odoo.convertToMedusaProduct(odooProduct, {
      brandName: brandName || undefined,
      ribbonText: ribbonText || undefined,
    })

    // Check if product already exists
    const existing = await productService.listProducts(
      {},
      { select: ["id", "handle", "metadata"], take: 5000 }
    )
    const existingProduct = existing.find(
      (p: any) => p.metadata?.odoo_id === odooId || p.metadata?.odoo_id === String(odooId)
    )

    let medusaProductId: string
    let action: string

    if (existingProduct) {
      // UPDATE
      await productService.updateProducts(existingProduct.id, {
        title: medusaData.title,
        subtitle: medusaData.subtitle,
        description: medusaData.description,
        status: medusaData.status as any,
        weight: medusaData.weight,
        metadata: medusaData.metadata,
      })
      medusaProductId = existingProduct.id
      action = "updated"
    } else {
      // CREATE
      const created: any = await productService.createProducts(medusaData as any)
      medusaProductId = Array.isArray(created) ? created[0]?.id : created?.id
      action = "created"
    }

    // Save main image
    if (odooProduct.image_1920 && typeof odooProduct.image_1920 === "string") {
      const sku = (odooProduct.default_code as string) || `odoo-${odooId}`
      const filename = `${slugify(sku)}.png`
      const imageUrl = await saveBase64Image(odooProduct.image_1920, filename)
      if (imageUrl && medusaProductId) {
        await productService.updateProducts(medusaProductId, {
          thumbnail: imageUrl,
          images: [{ url: imageUrl }],
        })
      }
    }

    console.log(`[Odoo Webhook] ✅ ${action} product: ${odooProduct.name} → ${medusaProductId}`)

    return res.status(200).json({
      status: "success",
      action,
      medusa_product_id: medusaProductId,
      odoo_id: odooId,
      product_name: odooProduct.name,
    })

  } catch (error: any) {
    console.error(`[Odoo Webhook] ❌ Error processing ${event_type} for ${odooId}:`, error.message)
    return res.status(500).json({
      type: "error",
      message: error.message,
    })
  }
}

/**
 * GET /odoo/webhooks/products
 * Health check / status endpoint
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  return res.status(200).json({
    status: "active",
    endpoint: "/odoo/webhooks/products",
    supported_events: ["product.created", "product.updated", "product.deleted"],
    note: "POST product data from Odoo automated actions to this endpoint",
  })
}
