import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /store/account/delete
 * Delete customer account (soft delete / anonymize)
 * 
 * Body: { customer_id, email, reason? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { customer_id, email, reason } = req.body as {
    customer_id?: string
    email?: string
    reason?: string
  }

  if (!customer_id && !email) {
    return res.status(400).json({
      type: "invalid_data",
      message: "customer_id or email is required",
    })
  }

  try {
    // Find the customer
    let customerResult
    if (customer_id) {
      customerResult = await pgConnection.raw(
        `SELECT id, email, first_name, last_name FROM customer WHERE id = ? AND deleted_at IS NULL`,
        [customer_id]
      )
    } else {
      customerResult = await pgConnection.raw(
        `SELECT id, email, first_name, last_name FROM customer WHERE email = ? AND deleted_at IS NULL`,
        [email]
      )
    }

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Customer not found",
      })
    }

    const customer = customerResult.rows[0]

    // Soft delete the customer (set deleted_at timestamp)
    await pgConnection.raw(
      `UPDATE customer SET deleted_at = NOW(), metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{deletion_reason}',
        ?::jsonb
      ) WHERE id = ?`,
      [JSON.stringify(reason || "Customer requested deletion"), customer.id]
    )

    // Anonymize customer addresses
    await pgConnection.raw(
      `UPDATE customer_address SET 
        first_name = 'Deleted',
        last_name = 'User',
        phone = NULL,
        address_1 = 'Deleted',
        address_2 = NULL,
        deleted_at = NOW()
      WHERE customer_id = ?`,
      [customer.id]
    )

    // Remove auth identity link (prevent login)
    try {
      await pgConnection.raw(
        `DELETE FROM provider_identity WHERE entity_id = ?`,
        [customer.email]
      )
    } catch (err) {
      // Auth identity may not exist, that's ok
      console.warn("[Delete Account] Could not remove auth identity:", err)
    }

    res.json({
      success: true,
      message: "Account has been deleted successfully",
      deleted_customer_id: customer.id,
    })
  } catch (error: any) {
    console.error("[Delete Account] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}
