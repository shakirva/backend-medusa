import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Order Placed Notification Subscriber
 * Sends email confirmation when an order is placed
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const orderService = container.resolve(Modules.ORDER);
  const logger = container.resolve("logger");

  try {
    // Get order details
    const order = await orderService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address", "customer"],
    });

    if (!order.email) {
      logger.warn(`Order ${order.id} has no email address, skipping notification`);
      return;
    }

    // Format order items for email
    const itemsHtml = order.items
      ?.map(
        (item) =>
          `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.unit_price, order.currency_code)}</td>
          </tr>`
      )
      .join("") || "";

    // Send order confirmation email
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-confirmation",
      data: {
        order_id: order.id,
        display_id: order.display_id,
        customer_name: order.shipping_address?.first_name || "Customer",
        email: order.email,
        items: order.items,
        items_html: itemsHtml,
        subtotal: formatPrice(Number(order.subtotal), order.currency_code),
        shipping_total: formatPrice(Number(order.shipping_total), order.currency_code),
        tax_total: formatPrice(Number(order.tax_total), order.currency_code),
        total: formatPrice(Number(order.total), order.currency_code),
        currency_code: order.currency_code?.toUpperCase(),
        shipping_address: order.shipping_address
          ? `${order.shipping_address.address_1 || ""}, ${order.shipping_address.city || ""}, ${order.shipping_address.country_code?.toUpperCase() || ""}`
          : "",
        created_at: new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    });

    logger.info(`Order confirmation email sent to ${order.email} for order ${order.display_id}`);
  } catch (error) {
    logger.error(`Failed to send order confirmation for order ${data.id}:`, error as Error);
  }
}

/**
 * Format price for display
 */
function formatPrice(amount: number | undefined, currencyCode: string): string {
  if (amount === undefined) return "0.000";
  
  // KWD has 3 decimal places
  const decimals = currencyCode?.toLowerCase() === "kwd" ? 3 : 2;
  const formatted = (amount / Math.pow(10, decimals)).toFixed(decimals);
  
  const currencySymbols: Record<string, string> = {
    kwd: "KD",
    usd: "$",
    eur: "€",
  };
  
  const symbol = currencySymbols[currencyCode?.toLowerCase()] || currencyCode?.toUpperCase();
  return `${symbol} ${formatted}`;
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
