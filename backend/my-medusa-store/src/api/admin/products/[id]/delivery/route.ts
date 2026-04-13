import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/products/:id/delivery
 * Returns night_delivery status for a product.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params

  try {
    const result = await pg.raw(
      `SELECT id, title, metadata FROM product WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )

    if (!result.rows?.length) {
      return res.status(404).json({ message: "Product not found" })
    }

    const metadata = result.rows[0].metadata || {}

    res.json({
      product_id: id,
      night_delivery: metadata.night_delivery === true,
      fast_delivery_areas: metadata.fast_delivery_areas || [],
    })
  } catch (error: any) {
    console.error("[Delivery Settings] GET error:", error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * POST /admin/products/:id/delivery
 * Toggle night_delivery (and optionally fast_delivery_areas) for a product.
 *
 * Body: { night_delivery: true/false, fast_delivery_areas?: string[] }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params
  const body = req.body as { night_delivery?: boolean; fast_delivery_areas?: string[] }

  try {
    // Fetch current metadata
    const result = await pg.raw(
      `SELECT id, title, metadata FROM product WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )

    if (!result.rows?.length) {
      return res.status(404).json({ message: "Product not found" })
    }

    const currentMeta = result.rows[0].metadata || {}

    // Merge only the delivery fields
    const updated = {
      ...currentMeta,
      ...(body.night_delivery !== undefined && { night_delivery: body.night_delivery }),
      ...(body.fast_delivery_areas !== undefined && { fast_delivery_areas: body.fast_delivery_areas }),
    }

    await pg.raw(
      `UPDATE product SET metadata = ?::jsonb, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(updated), id]
    )

    console.log(`[Delivery Settings] Product ${id}: night_delivery=${updated.night_delivery}`)

    res.json({
      success: true,
      product_id: id,
      night_delivery: updated.night_delivery === true,
      fast_delivery_areas: updated.fast_delivery_areas || [],
    })
  } catch (error: any) {
    console.error("[Delivery Settings] POST error:", error)
    res.status(500).json({ message: error.message })
  }
}
