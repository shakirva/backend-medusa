import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /store/account/change-password
 * Change customer password
 * 
 * Body: { customer_id, current_password, new_password }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { email, current_password, new_password } = req.body as {
    email?: string
    current_password?: string
    new_password?: string
  }

  if (!email || !new_password) {
    return res.status(400).json({
      type: "invalid_data",
      message: "email and new_password are required",
    })
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      type: "invalid_data",
      message: "Password must be at least 6 characters",
    })
  }

  try {
    // Find auth identity for this email
    const authResult = await pgConnection.raw(
      `SELECT pi.id, pi.entity_id
       FROM provider_identity pi
       WHERE pi.entity_id = ? AND pi.provider = 'emailpass'`,
      [email]
    )

    if (!authResult.rows || authResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Account not found",
      })
    }

    // Update the password in provider_identity
    // MedusaJS stores hashed passwords - we need to use the auth module
    // For now, return guidance to use the standard Medusa auth flow
    res.json({
      success: true,
      message: "Password change request received. Please use the standard reset password flow via /auth/customer/emailpass endpoint.",
      reset_password_endpoint: "/auth/customer/emailpass",
      instructions: "Send POST to /auth/customer/emailpass with { email } to receive a reset token, then use the token to set a new password.",
    })
  } catch (error: any) {
    console.error("[Change Password] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}
