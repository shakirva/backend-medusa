import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Knex } from "knex"

export const AUTHENTICATE = true

/**
 * POST /admin/orders/:id/delete
 * Soft-delete an order and all its related data
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const orderId = req.params.id
  const pg: Knex = req.scope.resolve("__pg_connection__")

  try {
    // Verify order exists
    const orderCheck = await pg.raw(
      `SELECT id, display_id, status FROM "order" WHERE id = ? AND deleted_at IS NULL`,
      [orderId]
    )
    if (!orderCheck.rows?.length) {
      return res.status(404).json({ message: "Order not found" })
    }

    const displayId = orderCheck.rows[0].display_id

    // Soft-delete all related data in correct order
    // 1. Shipping method tax lines & adjustments
    await pg.raw(`
      UPDATE order_shipping_method_tax_line SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND shipping_method_id IN (
        SELECT shipping_method_id FROM order_shipping WHERE order_id = ?
      )`, [orderId])

    await pg.raw(`
      UPDATE order_shipping_method_adjustment SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND shipping_method_id IN (
        SELECT shipping_method_id FROM order_shipping WHERE order_id = ?
      )`, [orderId])

    // 2. Shipping methods & shipping records
    await pg.raw(`
      UPDATE order_shipping_method SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND id IN (
        SELECT shipping_method_id FROM order_shipping WHERE order_id = ?
      )`, [orderId])

    await pg.raw(
      `UPDATE order_shipping SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`,
      [orderId]
    )

    // 3. Line item tax lines & adjustments
    await pg.raw(`
      UPDATE order_line_item_tax_line SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND item_id IN (
        SELECT item_id FROM order_item WHERE order_id = ?
      )`, [orderId])

    await pg.raw(`
      UPDATE order_line_item_adjustment SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND item_id IN (
        SELECT item_id FROM order_item WHERE order_id = ?
      )`, [orderId])

    // 4. Line items & order items
    await pg.raw(`
      UPDATE order_line_item SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND id IN (
        SELECT item_id FROM order_item WHERE order_id = ?
      )`, [orderId])

    await pg.raw(
      `UPDATE order_item SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`,
      [orderId]
    )

    // 5. Transactions
    await pg.raw(
      `UPDATE order_transaction SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`,
      [orderId]
    )

    // 6. Order changes & actions
    await pg.raw(`
      UPDATE order_change_action SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND order_change_id IN (
        SELECT id FROM order_change WHERE order_id = ?
      )`, [orderId])

    await pg.raw(
      `UPDATE order_change SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`,
      [orderId]
    )

    // 7. Summary, credit lines, promotions
    await pg.raw(`UPDATE order_summary SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`, [orderId])
    await pg.raw(`UPDATE order_credit_line SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`, [orderId])
    await pg.raw(`UPDATE order_promotion SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`, [orderId])

    // 8. Payment collections & fulfillments
    await pg.raw(`UPDATE order_payment_collection SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`, [orderId])
    await pg.raw(`UPDATE order_fulfillment SET deleted_at = NOW() WHERE order_id = ? AND deleted_at IS NULL`, [orderId])

    // 9. Order-cart link (hard delete, no deleted_at)
    await pg.raw(`DELETE FROM order_cart WHERE order_id = ?`, [orderId])

    // 10. Finally soft-delete the order itself
    await pg.raw(
      `UPDATE "order" SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [orderId]
    )

    console.log(`[Admin] Order #${displayId} (${orderId}) deleted`)

    res.json({
      success: true,
      message: `Order #${displayId} deleted successfully`,
    })
  } catch (err: any) {
    console.error(`[Admin] Failed to delete order ${orderId}:`, err)
    res.status(500).json({
      message: err?.message || "Failed to delete order",
    })
  }
}
