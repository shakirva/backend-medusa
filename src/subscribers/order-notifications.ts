import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { sendOrderStatusEmail } from "../lib/email";

/**
 * Order Placed Notification Subscriber
 * Sends email confirmation when an order is placed.
 * Uses nodemailer/Gmail SMTP directly (not the local notification provider).
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER);
  const logger = container.resolve("logger");

  try {
    // Get order details
    const order = await orderService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    });

    if (!order.email) {
      logger.warn(`[OrderEmail] Order ${order.id} has no email address — skipping`);
      return;
    }

    // Build customer name from shipping address
    const firstName = order.shipping_address?.first_name || "";
    const lastName = (order.shipping_address as any)?.last_name || "";
    const customerName = `${firstName} ${lastName}`.trim() || "Valued Customer";

    // Calculate totals from items (Medusa v2 order.total/subtotal are undefined on retrieveOrder)
    const orderItems = (order.items || []).map((item: any) => ({
      title: item.title || item.product_title || "Product",
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
    }));
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const shippingAddress = order.shipping_address
      ? [
          order.shipping_address.address_1,
          order.shipping_address.city,
          order.shipping_address.country_code?.toUpperCase(),
        ]
          .filter(Boolean)
          .join(", ")
      : undefined;

    await sendOrderStatusEmail("order.confirmed", order.email, {
      customerName,
      orderId: order.id,
      displayId: order.display_id,
      items: orderItems,
      subtotal,
      total: subtotal,
      currencyCode: order.currency_code || "kwd",
      shippingAddress,
    });

    logger.info(
      `[OrderEmail] ✅ Order confirmation sent to ${order.email} for order #${order.display_id}`
    );
  } catch (error: any) {
    logger.error(`[OrderEmail] ❌ Failed to send order confirmation for ${data.id}: ${error.message}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
