import type { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

/**
 * GET /store/cart/session
 *
 * Returns the cart_id saved on the customer's server account.
 * Use this on login to restore the cart on any device.
 *
 * Headers:
 *   Authorization: Bearer {customer_token}
 *
 * Response 200:
 * {
 *   "cart_id": "cart_01ABC..."   // null if no saved cart
 * }
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const result = await pgConnection.raw(
    `SELECT metadata FROM customer WHERE id = ? AND deleted_at IS NULL`,
    [customer_id]
  )

  if (!result.rows || result.rows.length === 0) {
    return res.status(404).json({ message: "Customer not found" })
  }

  const metadata = result.rows[0].metadata || {}
  const cart_id = metadata.cart_id || null

  return res.json({ cart_id })
}

/**
 * POST /store/cart/session
 *
 * Saves the customer's active cart_id to their server account.
 * Call this after creating or updating the cart so it persists across devices.
 *
 * Headers:
 *   Authorization: Bearer {customer_token}
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   "cart_id": "cart_01ABC..."    // pass null to clear
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "cart_id": "cart_01ABC..."
 * }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }

  const { cart_id } = req.body as { cart_id?: string | null }

  if (cart_id !== null && cart_id !== undefined && typeof cart_id !== "string") {
    return res.status(400).json({ message: "cart_id must be a string or null" })
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // Get current metadata to merge (don't overwrite other metadata fields)
  const customerResult = await pgConnection.raw(
    `SELECT metadata FROM customer WHERE id = ? AND deleted_at IS NULL`,
    [customer_id]
  )

  if (!customerResult.rows || customerResult.rows.length === 0) {
    return res.status(404).json({ message: "Customer not found" })
  }

  const existingMetadata = customerResult.rows[0].metadata || {}
  const updatedMetadata = {
    ...existingMetadata,
    cart_id: cart_id ?? null,
  }

  await pgConnection.raw(
    `UPDATE customer SET metadata = ?, updated_at = NOW() WHERE id = ?`,
    [JSON.stringify(updatedMetadata), customer_id]
  )

  return res.json({
    success: true,
    cart_id: cart_id ?? null,
  })
}
