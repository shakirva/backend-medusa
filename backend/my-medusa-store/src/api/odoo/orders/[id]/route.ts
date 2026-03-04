import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /odoo/orders/:id
 * Get a specific order for Odoo integration
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    // Get order
    const orderResult = await pgConnection.raw(
      `SELECT 
        o.id,
        o.display_id,
        o.status,
        o.email,
        o.currency_code,
        o.created_at,
        o.updated_at,
        o.canceled_at,
        o.metadata,
        c.id as customer_id,
        c.email as customer_email,
        c.first_name,
        c.last_name,
        c.phone
       FROM "order" o
       LEFT JOIN customer c ON o.customer_id = c.id
       WHERE o.id = $1 OR o.display_id::text = $1`,
      [id]
    );

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // Get line items with full product details
    const itemsResult = await pgConnection.raw(
      `SELECT 
        li.id,
        li.title,
        li.quantity,
        li.unit_price,
        li.variant_id,
        li.product_id,
        pv.sku,
        pv.title as variant_title,
        pv.barcode,
        pv.weight,
        p.title as product_title,
        p.handle as product_handle
       FROM order_line_item li
       LEFT JOIN product_variant pv ON li.variant_id = pv.id
       LEFT JOIN product p ON pv.product_id = p.id
       WHERE li.order_id = $1`,
      [order.id]
    );

    // Get shipping address
    const shippingAddressResult = await pgConnection.raw(
      `SELECT 
        a.first_name,
        a.last_name,
        a.address_1,
        a.address_2,
        a.city,
        a.postal_code,
        a.phone,
        a.country_code,
        a.province
       FROM order_address a
       JOIN "order" o ON o.shipping_address_id = a.id
       WHERE o.id = $1`,
      [order.id]
    );

    // Get billing address
    const billingAddressResult = await pgConnection.raw(
      `SELECT 
        a.first_name,
        a.last_name,
        a.address_1,
        a.address_2,
        a.city,
        a.postal_code,
        a.phone,
        a.country_code,
        a.province
       FROM order_address a
       JOIN "order" o ON o.billing_address_id = a.id
       WHERE o.id = $1`,
      [order.id]
    );

    // Get payment info
    const paymentResult = await pgConnection.raw(
      `SELECT 
        pc.id,
        pc.amount,
        pc.currency_code,
        pc.provider_id,
        pc.created_at,
        p.amount as payment_amount,
        p.captured_at
       FROM payment_collection pc
       LEFT JOIN payment p ON p.payment_collection_id = pc.id
       WHERE pc.id IN (
         SELECT payment_collection_id FROM order_payment_collection WHERE order_id = $1
       )`,
      [order.id]
    );

    // Get fulfillment info
    const fulfillmentResult = await pgConnection.raw(
      `SELECT 
        f.id,
        f.status,
        f.shipped_at,
        f.delivered_at,
        f.canceled_at,
        f.created_at,
        f.data,
        f.metadata
       FROM fulfillment f
       WHERE f.order_id = $1`,
      [order.id]
    );

    // Calculate totals
    const items = itemsResult.rows || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0);

    res.json({
      order: {
        id: order.id,
        display_id: order.display_id,
        status: order.status,
        email: order.email,
        currency_code: order.currency_code,
        created_at: order.created_at,
        updated_at: order.updated_at,
        canceled_at: order.canceled_at,
        metadata: order.metadata,
        
        // Customer
        customer: order.customer_id
          ? {
              id: order.customer_id,
              email: order.customer_email,
              first_name: order.first_name,
              last_name: order.last_name,
              phone: order.phone,
            }
          : null,

        // Addresses
        shipping_address: shippingAddressResult.rows[0] || null,
        billing_address: billingAddressResult.rows[0] || null,

        // Items
        items: items.map((item: any) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.unit_price * item.quantity,
          variant_id: item.variant_id,
          product_id: item.product_id,
          sku: item.sku,
          barcode: item.barcode,
          weight: item.weight,
          variant_title: item.variant_title,
          product_title: item.product_title,
          product_handle: item.product_handle,
        })),

        // Totals
        totals: {
          subtotal,
          // Add shipping, tax, discount if available
        },

        // Payment
        payments: paymentResult.rows || [],

        // Fulfillment
        fulfillments: fulfillmentResult.rows || [],
      },
    });
  } catch (error: any) {
    console.error("[Odoo Order Detail] Error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * PATCH /odoo/orders/:id
 * Update order status from Odoo
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { status, odoo_order_id, odoo_status, metadata } = req.body as {
    status?: string;
    odoo_order_id?: string;
    odoo_status?: string;
    metadata?: Record<string, any>;
  };

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    // Check if order exists
    const orderResult = await pgConnection.raw(
      `SELECT id, metadata FROM "order" WHERE id = $1 OR display_id::text = $1`,
      [id]
    );

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];
    const existingMetadata = order.metadata || {};

    // Prepare updates
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    // Merge metadata with Odoo info
    const newMetadata = {
      ...existingMetadata,
      ...(metadata || {}),
      odoo: {
        ...(existingMetadata.odoo || {}),
        order_id: odoo_order_id || existingMetadata.odoo?.order_id,
        status: odoo_status || existingMetadata.odoo?.status,
        synced_at: new Date().toISOString(),
      },
    };

    updates.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(newMetadata));

    updates.push(`updated_at = NOW()`);

    values.push(order.id);

    await pgConnection.raw(
      `UPDATE "order" SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    res.json({
      success: true,
      order_id: order.id,
      metadata: newMetadata,
    });
  } catch (error: any) {
    console.error("[Odoo Order Update] Error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};
