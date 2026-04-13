/**
 * GET /store/products/by-odoo-ids?ids=92581,92588,87284
 *
 * Fetches Medusa products by Odoo IDs stored in product.metadata->>'odoo_id'.
 * Used by the storefront to resolve alternative/upsell/accessory product cards.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const rawIds = req.query.ids as string
  if (!rawIds) {
    return res.status(400).json({ message: "ids query param required (comma-separated Odoo IDs)" })
  }

  const odooIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10) // safety cap

  if (!odooIds.length) {
    return res.json({ products: [] })
  }

  try {
    // Build parameterised IN clause
    const placeholders = odooIds.map(() => "?").join(", ")
    const result = await pg.raw(
      `SELECT
         p.id,
         p.title,
         p.handle,
         p.thumbnail,
         p.status,
         p.metadata,
         pv.id   AS variant_id,
         pv.sku,
         pr.amount,
         pr.currency_code
       FROM product p
       LEFT JOIN product_variant pv
              ON pv.product_id = p.id AND pv.deleted_at IS NULL
       LEFT JOIN product_variant_price_set pvps
              ON pvps.variant_id = pv.id
       LEFT JOIN price pr
              ON pr.price_set_id = pvps.price_set_id AND pr.deleted_at IS NULL
       WHERE p.metadata->>'odoo_id' IN (${placeholders})
         AND p.deleted_at IS NULL
         AND p.status = 'published'`,
      odooIds
    )

    // De-duplicate: one row per product (take first price row)
    const seen = new Map<string, any>()
    for (const row of result.rows || []) {
      if (!seen.has(row.id)) {
        seen.set(row.id, {
          id: row.id,
          title: row.title,
          handle: row.handle,
          thumbnail: row.thumbnail,
          metadata: row.metadata || {},
          variants: [],
        })
      }
      if (row.variant_id) {
        const prod = seen.get(row.id)!
        // Only push one price entry per variant
        if (!prod.variants.find((v: any) => v.id === row.variant_id)) {
          prod.variants.push({
            id: row.variant_id,
            sku: row.sku,
            prices: row.amount != null
              ? [{ amount: row.amount, currency_code: row.currency_code }]
              : [],
          })
        }
      }
    }

    return res.json({ products: Array.from(seen.values()) })
  } catch (err: any) {
    console.error("[by-odoo-ids] Error:", err.message)
    return res.status(500).json({ message: err.message })
  }
}
