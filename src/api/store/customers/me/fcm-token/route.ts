import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /store/customers/me/fcm-token
 * Save or update the Flutter FCM device token for push notifications
 * 
 * Flutter calls this:
 * 1. After login/register — save FCM token
 * 2. When Firebase refreshes token — update FCM token
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { fcm_token, device_type } = req.body as {
    fcm_token: string;
    device_type?: "android" | "ios";
  };

  if (!fcm_token) {
    return res.status(400).json({ message: "fcm_token is required" });
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    // Get current metadata
    const result = await pgConnection.raw(
      `SELECT metadata FROM customer WHERE id = ?`,
      [customerId]
    );

    if (!result.rows?.length) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const currentMetadata = result.rows[0].metadata || {};

    // Save FCM token in customer metadata
    const updatedMetadata = {
      ...currentMetadata,
      fcm_token,
      fcm_device_type: device_type || "android",
      fcm_token_updated_at: new Date().toISOString(),
    };

    await pgConnection.raw(
      `UPDATE customer SET metadata = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(updatedMetadata), customerId]
    );

    console.log(`[FCM] Token saved for customer ${customerId}`);

    return res.json({ success: true, message: "FCM token saved" });
  } catch (error: any) {
    console.error("[FCM] Error saving token:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /store/customers/me/fcm-token
 * Remove FCM token on logout
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    const result = await pgConnection.raw(
      `SELECT metadata FROM customer WHERE id = ?`,
      [customerId]
    );

    const currentMetadata = result.rows[0]?.metadata || {};
    const { fcm_token, fcm_device_type, fcm_token_updated_at, ...rest } = currentMetadata;

    await pgConnection.raw(
      `UPDATE customer SET metadata = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(rest), customerId]
    );

    return res.json({ success: true, message: "FCM token removed" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
