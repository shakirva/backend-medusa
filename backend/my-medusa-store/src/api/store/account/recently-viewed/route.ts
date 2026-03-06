import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/account/recently-viewed
 * Returns recently viewed products for a customer.
 * Uses customer metadata to store recently viewed product IDs.
 * 
 * Query params:
 *   customer_id - required
 *   limit       - optional (default 20)
 * 
 * POST /store/account/recently-viewed
 * Add a product to recently viewed list.
 * Body: { customer_id, product_id }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { customer_id, limit = "20" } = req.query as { customer_id?: string; limit?: string }

  if (!customer_id) {
    return res.status(400).json({
      type: "invalid_data",
      message: "customer_id is required",
    })
  }

  try {
    // Get customer metadata
    const customerResult = await pgConnection.raw(
      `SELECT metadata FROM customer WHERE id = ? AND deleted_at IS NULL`,
      [customer_id]
    )

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Customer not found",
      })
    }

    const metadata = customerResult.rows[0].metadata || {}
    const recentlyViewedIds: string[] = metadata.recently_viewed || []

    if (recentlyViewedIds.length === 0) {
      return res.json({ products: [], count: 0 })
    }

    // Fetch product details for recently viewed IDs
    const placeholders = recentlyViewedIds.map(() => "?").join(",")
    const productsResult = await pgConnection.raw(
      `SELECT 
        p.id, p.title, p.handle, p.subtitle, p.thumbnail, p.status,
        p.metadata, p.created_at,
        (SELECT MIN(pp.amount) FROM product_variant pv 
         JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
         JOIN price pp ON pp.price_set_id = pvps.price_set_id AND pp.deleted_at IS NULL
         WHERE pv.product_id = p.id AND pv.deleted_at IS NULL) as price,
        (SELECT pp.currency_code FROM product_variant pv 
         JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
         JOIN price pp ON pp.price_set_id = pvps.price_set_id AND pp.deleted_at IS NULL
         WHERE pv.product_id = p.id AND pv.deleted_at IS NULL LIMIT 1) as currency_code
       FROM product p
       WHERE p.id IN (${placeholders})
         AND p.deleted_at IS NULL AND p.status = 'published'`,
      recentlyViewedIds
    )

    // Maintain the order of recently viewed (most recent first)
    const productMap = new Map((productsResult.rows || []).map((p: any) => [p.id, p]))
    const orderedProducts = recentlyViewedIds
      .map((id: string) => productMap.get(id))
      .filter(Boolean)
      .slice(0, parseInt(limit))

    res.json({
      products: orderedProducts,
      count: orderedProducts.length,
    })
  } catch (error: any) {
    console.error("[Recently Viewed] GET error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { customer_id, product_id } = req.body as { customer_id?: string; product_id?: string }

  if (!customer_id || !product_id) {
    return res.status(400).json({
      type: "invalid_data",
      message: "customer_id and product_id are required",
    })
  }

  try {
    // Get current metadata
    const customerResult = await pgConnection.raw(
      `SELECT metadata FROM customer WHERE id = ? AND deleted_at IS NULL`,
      [customer_id]
    )

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({ type: "not_found", message: "Customer not found" })
    }

    const metadata = customerResult.rows[0].metadata || {}
    let recentlyViewed: string[] = metadata.recently_viewed || []

    // Remove if already exists (to move to front)
    recentlyViewed = recentlyViewed.filter((id: string) => id !== product_id)
    // Add to front
    recentlyViewed.unshift(product_id)
    // Keep max 50
    recentlyViewed = recentlyViewed.slice(0, 50)

    metadata.recently_viewed = recentlyViewed

    await pgConnection.raw(
      `UPDATE customer SET metadata = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(metadata), customer_id]
    )

    res.json({
      success: true,
      recently_viewed_count: recentlyViewed.length,
    })
  } catch (error: any) {
    console.error("[Recently Viewed] POST error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}
