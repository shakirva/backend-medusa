import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

/**
 * GET /store/cart/:id/night-delivery
 * Returns whether ALL products in the cart have night delivery enabled.
 * Used by checkout page to decide whether to show the Night Delivery option.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params as { id: string }

  if (!cartId) {
    return res.status(400).json({ message: "Cart ID is required" })
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    const result = await pg.raw(
      `SELECT cli.product_id, p.metadata
       FROM cart_line_item cli
       JOIN product p ON p.id = cli.product_id
       WHERE cli.cart_id = ?
         AND cli.deleted_at IS NULL
         AND p.deleted_at IS NULL`,
      [cartId]
    )

    const rows: Array<{ product_id: string; metadata: any }> = result.rows ?? []

    // Empty cart — default to allowed
    if (rows.length === 0) {
      return res.json({ night_delivery_allowed: true, product_count: 0 })
    }

    const enabledCount = rows.filter((row) => {
      const meta = row.metadata || {}
      return meta.night_delivery === true || meta.night_delivery === "true"
    }).length

    const nightDeliveryAllowed = enabledCount === rows.length

    return res.json({
      night_delivery_allowed: nightDeliveryAllowed,
      product_count: rows.length,
      enabled_count: enabledCount,
      disabled_count: rows.length - enabledCount,
    })
  } catch (err: any) {
    console.error("[Store Night Delivery] Error:", err)
    // Fail-open: don't block checkout on error
    return res.json({ night_delivery_allowed: true, product_count: 0, error: err.message })
  }
}
