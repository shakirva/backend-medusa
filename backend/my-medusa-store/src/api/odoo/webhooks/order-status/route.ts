import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /odoo/webhooks/order-status
 * Webhook for Odoo to update order status in Medusa
 * 
 * Call this when:
 * - Order is confirmed in Odoo
 * - Order is shipped/delivered
 * - Order is cancelled
 * - Invoice is created
 * - Payment is received
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    event_type,
    order,
  } = req.body as {
    event_type: 
      | "order.confirmed" 
      | "order.shipped" 
      | "order.delivered" 
      | "order.cancelled"
      | "order.invoiced"
      | "order.paid";
    order: {
      medusa_order_id?: string;     // Medusa order ID (preferred)
      odoo_order_id?: number;       // Odoo sale order ID
      odoo_order_name?: string;     // Odoo order reference (e.g., "S00123")
      status?: string;              // Odoo order state
      tracking_number?: string;
      tracking_url?: string;
      carrier_name?: string;
      shipped_date?: string;
      delivered_date?: string;
      cancelled_reason?: string;
      invoice_number?: string;
      invoice_date?: string;
      payment_date?: string;
      payment_method?: string;
    };
  };

  // Validate required fields
  if (!event_type || !order) {
    return res.status(400).json({
      type: "invalid_data",
      message: "event_type and order are required",
    });
  }

  if (!order.medusa_order_id && !order.odoo_order_id && !order.odoo_order_name) {
    return res.status(400).json({
      type: "invalid_data",
      message: "Either medusa_order_id, odoo_order_id, or odoo_order_name is required",
    });
  }

  console.log(`[Odoo Webhook] Received ${event_type} for order: ${order.medusa_order_id || order.odoo_order_name || order.odoo_order_id}`);

  try {
    // Find the Medusa order
    let medusaOrderId = order.medusa_order_id;

    if (!medusaOrderId && (order.odoo_order_id || order.odoo_order_name)) {
      // Try to find by Odoo reference stored in metadata
      // First check if there's a display_id that matches
      const orderSearch = await pgConnection.raw(
        `SELECT id, display_id FROM "order" 
         WHERE metadata->>'odoo_order_id' = $1
            OR metadata->>'odoo_order_name' = $2
         LIMIT 1`,
        [order.odoo_order_id?.toString(), order.odoo_order_name]
      );

      if (orderSearch.rows && orderSearch.rows.length > 0) {
        medusaOrderId = orderSearch.rows[0].id;
      }
    }

    if (!medusaOrderId) {
      return res.status(404).json({
        type: "not_found",
        message: "Order not found in Medusa",
        odoo_order_id: order.odoo_order_id,
        odoo_order_name: order.odoo_order_name,
      });
    }

    // Verify order exists
    const orderResult = await pgConnection.raw(
      `SELECT id, display_id, status, metadata FROM "order" WHERE id = $1`,
      [medusaOrderId]
    );

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Order not found",
        medusa_order_id: medusaOrderId,
      });
    }

    const existingOrder = orderResult.rows[0];
    const currentMetadata = existingOrder.metadata || {};

    // Prepare metadata update
    const metadataUpdate: Record<string, any> = {
      ...currentMetadata,
      odoo_last_update: new Date().toISOString(),
      odoo_last_event: event_type,
    };

    if (order.odoo_order_id) {
      metadataUpdate.odoo_order_id = order.odoo_order_id;
    }
    if (order.odoo_order_name) {
      metadataUpdate.odoo_order_name = order.odoo_order_name;
    }

    // Handle different event types
    switch (event_type) {
      case "order.confirmed":
        metadataUpdate.odoo_confirmed = true;
        metadataUpdate.odoo_confirmed_at = new Date().toISOString();
        break;

      case "order.shipped":
        metadataUpdate.odoo_shipped = true;
        metadataUpdate.odoo_shipped_at = order.shipped_date || new Date().toISOString();
        if (order.tracking_number) {
          metadataUpdate.tracking_number = order.tracking_number;
        }
        if (order.tracking_url) {
          metadataUpdate.tracking_url = order.tracking_url;
        }
        if (order.carrier_name) {
          metadataUpdate.carrier_name = order.carrier_name;
        }
        break;

      case "order.delivered":
        metadataUpdate.odoo_delivered = true;
        metadataUpdate.odoo_delivered_at = order.delivered_date || new Date().toISOString();
        break;

      case "order.cancelled":
        metadataUpdate.odoo_cancelled = true;
        metadataUpdate.odoo_cancelled_at = new Date().toISOString();
        if (order.cancelled_reason) {
          metadataUpdate.cancelled_reason = order.cancelled_reason;
        }
        break;

      case "order.invoiced":
        metadataUpdate.odoo_invoiced = true;
        metadataUpdate.odoo_invoiced_at = order.invoice_date || new Date().toISOString();
        if (order.invoice_number) {
          metadataUpdate.invoice_number = order.invoice_number;
        }
        break;

      case "order.paid":
        metadataUpdate.odoo_paid = true;
        metadataUpdate.odoo_paid_at = order.payment_date || new Date().toISOString();
        if (order.payment_method) {
          metadataUpdate.payment_method_odoo = order.payment_method;
        }
        break;
    }

    // Update order metadata
    await pgConnection.raw(
      `UPDATE "order" SET metadata = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(metadataUpdate), medusaOrderId]
    );

    res.json({
      success: true,
      event_type,
      order: {
        medusa_order_id: medusaOrderId,
        display_id: existingOrder.display_id,
        odoo_order_id: order.odoo_order_id,
        odoo_order_name: order.odoo_order_name,
      },
      metadata_updated: Object.keys(metadataUpdate).filter(k => !Object.keys(currentMetadata).includes(k)),
    });
  } catch (error: any) {
    console.error("[Odoo Webhook] Order status webhook error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * GET /odoo/webhooks/order-status
 * Health check for webhook endpoint
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "ok",
    endpoint: "order-status",
    description: "Odoo order status webhook endpoint",
    supported_events: [
      "order.confirmed",
      "order.shipped",
      "order.delivered",
      "order.cancelled",
      "order.invoiced",
      "order.paid",
    ],
    example_payload: {
      event_type: "order.shipped",
      order: {
        medusa_order_id: "order_01HXY123ABC456",
        odoo_order_id: 123,
        odoo_order_name: "S00123",
        tracking_number: "TRK123456789",
        tracking_url: "https://tracking.carrier.com/TRK123456789",
        carrier_name: "FedEx",
        shipped_date: "2024-01-15T10:30:00Z",
      },
    },
  });
};
