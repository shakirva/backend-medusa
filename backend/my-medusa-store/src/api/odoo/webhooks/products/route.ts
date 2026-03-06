import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /odoo/webhooks/products
 * 
 * SELF-CONTAINED webhook - Odoo pushes ALL product data directly.
 * No callback to Odoo needed. Works even if Odoo credentials change.
 * 
 * Images use direct Odoo URLs instead of downloading/storing locally.
 * 
 * Supports single + bulk operations.
 */

const WEBHOOK_SECRET = process.env.ODOO_WEBHOOK_SECRET || "marqa-odoo-webhook-2026"
const ODOO_BASE_URL = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com"

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/(^-|-$)/g, "").substring(0, 100)
}

function genId(prefix: string): string {
  const c = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let id = prefix + "_"
  for (let i = 0; i < 26; i++) id += c[Math.floor(Math.random() * c.length)]
  return id
}

/**
 * Generate direct Odoo image URL for a product
 */
function getOdooImageUrl(odooId: number): string {
  return `${ODOO_BASE_URL}/web/image/product.product/${odooId}/image_1920`
}

interface OdooProductPayload {
  odoo_id: number
  name: string
  default_code?: string
  barcode?: string
  list_price?: number
  compare_list_price?: number
  currency_code?: string
  description_sale?: string
  description?: string
  categ_id?: [number, string] | false
  brand?: string
  weight?: number
  image_url?: string
  image_1920?: string
  images?: string[]
  qty_available?: number
  is_published?: boolean
  [key: string]: any
}

async function upsertProduct(
  pg: any,
  p: OdooProductPayload,
  salesChannelId: string | null,
  existingHandles: Set<string>
): Promise<{ action: string; productId: string }> {
  const odooId = p.odoo_id
  const sku = p.default_code || `ODOO-${odooId}`
  const title = p.name || `Odoo Product ${odooId}`
  const price = p.list_price || 0
  const currency = (p.currency_code || "aed").toLowerCase()
  const description = p.description_sale || p.description || ""
  const weight = p.weight ? String(p.weight) : null
  const status = p.is_published === false ? "draft" : "published"
  const brand = p.brand || null
  const category = p.categ_id && Array.isArray(p.categ_id) ? p.categ_id[1] : null

  const metadata = {
    odoo_id: odooId,
    odoo_sku: sku,
    odoo_barcode: p.barcode || null,
    odoo_category: category,
    odoo_brand: brand,
    odoo_qty: p.qty_available || 0,
    synced_at: new Date().toISOString(),
  }

  // Check if product exists by odoo_id or SKU
  const existing = await pg.raw(
    `SELECT id, handle FROM product WHERE metadata->>'odoo_id' = ? AND deleted_at IS NULL LIMIT 1`,
    [String(odooId)]
  )
  const existBySku = existing.rows?.length
    ? existing
    : await pg.raw(
        `SELECT p.id, p.handle FROM product p JOIN product_variant pv ON pv.product_id = p.id WHERE pv.sku = ? AND p.deleted_at IS NULL AND pv.deleted_at IS NULL LIMIT 1`,
        [sku]
      )

  if (existBySku.rows?.length > 0) {
    const prodId = existBySku.rows[0].id
    await pg.raw(
      `UPDATE product SET title=?, description=?, status=?, weight=?, metadata=?, thumbnail=COALESCE(?, thumbnail), updated_at=NOW() WHERE id=?`,
      [title, description, status, weight, JSON.stringify(metadata), p.image_url || null, prodId]
    )
    const varRes = await pg.raw(
      `SELECT pv.id as vid, pvps.price_set_id as psid FROM product_variant pv LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id WHERE pv.product_id = ? AND pv.deleted_at IS NULL LIMIT 1`,
      [prodId]
    )
    if (varRes.rows?.length > 0 && varRes.rows[0].psid && price > 0) {
      const rawAmount = JSON.stringify({ value: String(price), precision: 20 })
      await pg.raw(
        `UPDATE price SET amount=?, raw_amount=?, currency_code=?, updated_at=NOW() WHERE price_set_id=? AND deleted_at IS NULL`,
        [price, rawAmount, currency, varRes.rows[0].psid]
      )
    }
    return { action: "updated", productId: prodId }
  }

  // CREATE new product
  let handle = slugify(title)
  if (!handle) handle = `odoo-${odooId}`
  if (existingHandles.has(handle)) handle = `${handle}-${odooId}`
  if (existingHandles.has(handle)) handle = `${handle}-${Date.now().toString(36)}`
  existingHandles.add(handle)

  let thumbnail: string | null = p.image_url || null
  if (!thumbnail && (p.image_1920 || p.odoo_id)) {
    // Use direct Odoo image URL instead of saving base64 locally
    thumbnail = getOdooImageUrl(odooId)
  }

  const productId = genId("prod")
  await pg.raw(
    `INSERT INTO product (id, title, handle, subtitle, description, thumbnail, status, weight, metadata, discountable, is_giftcard, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, NOW(), NOW())`,
    [productId, title, handle, brand || "", description, thumbnail, status, weight, JSON.stringify(metadata)]
  )

  const variantId = genId("variant")
  await pg.raw(
    `INSERT INTO product_variant (id, product_id, title, sku, barcode, manage_inventory, allow_backorder, variant_rank, created_at, updated_at) VALUES (?, ?, 'Default', ?, ?, true, false, 0, NOW(), NOW())`,
    [variantId, productId, sku, p.barcode || null]
  )

  if (price > 0) {
    const priceSetId = genId("pset")
    await pg.raw(`INSERT INTO price_set (id, created_at, updated_at) VALUES (?, NOW(), NOW())`, [priceSetId])
    await pg.raw(
      `INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [genId("pvps"), variantId, priceSetId]
    )
    const rawAmount = JSON.stringify({ value: String(price), precision: 20 })
    await pg.raw(
      `INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [genId("price"), priceSetId, currency, price, rawAmount]
    )
  }

  if (thumbnail) {
    await pg.raw(
      `INSERT INTO image (id, url, rank, product_id, created_at, updated_at) VALUES (?, ?, 0, ?, NOW(), NOW())`,
      [genId("img"), thumbnail, productId]
    )
  }
  if (p.images && Array.isArray(p.images)) {
    for (let idx = 0; idx < p.images.length; idx++) {
      await pg.raw(
        `INSERT INTO image (id, url, rank, product_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [genId("img"), p.images[idx], idx + 1, productId]
      )
    }
  }

  if (salesChannelId) {
    try {
      await pg.raw(
        `INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON CONFLICT (product_id, sales_channel_id) DO NOTHING`,
        [genId("psc"), productId, salesChannelId]
      )
    } catch { /* ignore */ }
  }

  return { action: "created", productId }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const startTime = Date.now()
  const body = req.body as any
  const { event_type, webhook_secret } = body

  if (WEBHOOK_SECRET && webhook_secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ type: "unauthorized", message: "Invalid webhook_secret" })
  }
  if (!event_type) {
    return res.status(400).json({ type: "invalid_data", message: "event_type is required" })
  }

  console.log(`[Odoo Webhook] ${event_type} received`)

  try {
    const scRes = await pg.raw(`SELECT id FROM sales_channel WHERE deleted_at IS NULL LIMIT 1`)
    const salesChannelId = scRes.rows?.[0]?.id || null
    const hRes = await pg.raw(`SELECT handle FROM product WHERE deleted_at IS NULL`)
    const existingHandles = new Set<string>(hRes.rows?.map((r: any) => r.handle) || [])

    // DELETE
    if (event_type === "product.deleted") {
      const odooId = body.product?.odoo_id
      if (!odooId) return res.status(400).json({ message: "product.odoo_id required" })
      const found = await pg.raw(
        `SELECT id, title FROM product WHERE metadata->>'odoo_id' = ? AND deleted_at IS NULL`,
        [String(odooId)]
      )
      if (found.rows?.length > 0) {
        await pg.raw(`UPDATE product SET deleted_at=NOW(), status='draft' WHERE id=?`, [found.rows[0].id])
        console.log(`[Odoo Webhook] Deleted: ${found.rows[0].title}`)
        return res.json({ status: "success", action: "deleted", id: found.rows[0].id })
      }
      return res.json({ status: "not_found", message: `No product for Odoo ID ${odooId}` })
    }

    // BULK
    if (event_type === "product.bulk") {
      const products: OdooProductPayload[] = body.products || []
      if (!products.length) return res.status(400).json({ message: "products array required" })
      let created = 0, updated = 0, errors = 0
      for (const p of products) {
        try {
          if (!p.odoo_id || !p.name) { errors++; continue }
          const r = await upsertProduct(pg, p, salesChannelId, existingHandles)
          if (r.action === "created") created++; else updated++
        } catch (err: any) {
          errors++
          console.error(`[Odoo Webhook] Bulk err [${p.odoo_id}]: ${err.message}`)
        }
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Odoo Webhook] Bulk done: created=${created} updated=${updated} errors=${errors} (${elapsed}s)`)
      return res.json({ status: "success", action: "bulk", created, updated, errors, total: products.length, elapsed_seconds: elapsed })
    }

    // SINGLE CREATE/UPDATE
    const p: OdooProductPayload = body.product
    if (!p?.odoo_id || !p?.name) {
      return res.status(400).json({ message: "product.odoo_id and product.name are required" })
    }
    const result = await upsertProduct(pg, p, salesChannelId, existingHandles)
    console.log(`[Odoo Webhook] ${result.action}: ${p.name} -> ${result.productId}`)
    return res.json({ status: "success", ...result, odoo_id: p.odoo_id, product_name: p.name })

  } catch (error: any) {
    console.error(`[Odoo Webhook] Error:`, error.message)
    return res.status(500).json({ type: "error", message: error.message })
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const countRes = await pg.raw(`SELECT COUNT(*) as c FROM product WHERE status='published' AND deleted_at IS NULL`)
  const odooCount = await pg.raw(`SELECT COUNT(*) as c FROM product WHERE metadata->>'odoo_id' IS NOT NULL AND deleted_at IS NULL`)

  return res.json({
    status: "active",
    endpoint: "/odoo/webhooks/products",
    total_products: parseInt(countRes.rows?.[0]?.c || "0"),
    odoo_synced_products: parseInt(odooCount.rows?.[0]?.c || "0"),
    supported_events: ["product.created", "product.updated", "product.deleted", "product.bulk"],
    webhook_secret: "Required in request body",
    example_single: {
      event_type: "product.created",
      webhook_secret: "<secret>",
      product: { odoo_id: 123, name: "Product Name", default_code: "SKU-001", list_price: 99.99, currency_code: "aed", description_sale: "Description", brand: "Brand", image_url: "https://example.com/image.jpg", is_published: true },
    },
    example_bulk: {
      event_type: "product.bulk",
      webhook_secret: "<secret>",
      products: ["... array of product objects ..."],
    },
  })
}
