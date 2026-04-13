import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendPushNotification } from "../lib/firebase";

/**
 * Order Status Push Notification Subscriber
 * Fires when Odoo webhook updates order metadata (shipped/delivered/cancelled)
 * 
 * The Odoo webhook at POST /odoo/webhooks/order-status emits this custom event
 * after updating order metadata.
 */
export default async function orderStatusPushHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  order_id: string;
  customer_id?: string;
  display_id?: number;
  event_type: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier_name?: string;
}>) {
  const logger = container.resolve("logger");
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const { order_id, customer_id, display_id, event_type, tracking_number, carrier_name } = data;

  if (!customer_id) {
    logger.info(`[FCM] No customer_id for order ${order_id} — skipping push`);
    return;
  }

  try {
    // Get FCM token from customer metadata
    const customerResult = await pgConnection.raw(
      `SELECT metadata FROM customer WHERE id = ?`,
      [customer_id]
    );

    const fcmToken = customerResult.rows?.[0]?.metadata?.fcm_token;

    if (!fcmToken) {
      logger.info(`[FCM] No FCM token for customer ${customer_id} — skipping push`);
      return;
    }

    // Build notification content based on event type
    let title = "";
    let body = "";
    const pushData: Record<string, string> = {
      type: event_type,
      order_id,
      display_id: String(display_id || ""),
    };

    switch (event_type) {
      case "order.shipped":
        title = "Your Order is On the Way! 🚚";
        body = tracking_number
          ? `Order #${display_id} shipped via ${carrier_name || "courier"}. Tracking: ${tracking_number}`
          : `Order #${display_id} has been shipped and is on its way!`;
        if (tracking_number) pushData.tracking_number = tracking_number;
        break;

      case "order.delivered":
        title = "Order Delivered! ✅";
        body = `Order #${display_id} has been delivered. Enjoy your purchase!`;
        break;

      case "order.cancelled":
        title = "Order Cancelled";
        body = `Order #${display_id} has been cancelled. Contact support if you need help.`;
        break;

      case "order.confirmed":
        title = "Order Confirmed! 🎉";
        body = `Order #${display_id} is confirmed and being prepared.`;
        break;

      default:
        logger.info(`[FCM] Unknown event type ${event_type} — skipping push`);
        return;
    }

    await sendPushNotification({ fcmToken, title, body, data: pushData });
    logger.info(`[FCM] ✅ Push sent for ${event_type} — order #${display_id}`);
  } catch (error: any) {
    logger.warn(`[FCM] Push failed for ${event_type}: ${error.message}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.status.updated",
};
