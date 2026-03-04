import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /odoo/orders
 * Get orders for Odoo integration with filters
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    status,
    date_from,
    date_to,
    limit = "50",
    offset = "0",
    synced,
  } = req.query as {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: string;
    offset?: string;
    synced?: string;
  };

  try {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      whereClause += ` AND o.status IN (${statuses.map(() => `$${paramIndex++}`).join(",")})`;
      params.push(...statuses);
    }

    // Filter by date range
    if (date_from) {
      whereClause += ` AND o.created_at >= $${paramIndex++}`;
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ` AND o.created_at <= $${paramIndex++}`;
      params.push(date_to);
    }

    // Get total count
    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total FROM "order" o ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total) || 0;

    // Get orders
    const ordersResult = await pgConnection.raw(
      `SELECT 
        o.id,
        o.display_id,
        o.status,
        o.email,
        o.currency_code,
        o.created_at,
        o.updated_at,
        o.metadata,
        c.id as customer_id,
        c.email as customer_email,
        c.first_name,
        c.last_name,
        c.phone
       FROM "order" o
       LEFT JOIN customer c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get order items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order: any) => {
        // Get line items
        const itemsResult = await pgConnection.raw(
          `SELECT 
            li.id,
            li.title,
            li.quantity,
            li.unit_price,
            li.variant_id,
            li.product_id,
            pv.sku,
            pv.title as variant_title
           FROM order_line_item li
           LEFT JOIN product_variant pv ON li.variant_id = pv.id
           WHERE li.order_id = $1`,
          [order.id]
        );

        // Get shipping address
        const addressResult = await pgConnection.raw(
          `SELECT 
            a.first_name,
            a.last_name,
            a.address_1,
            a.address_2,
            a.city,
            a.postal_code,
            a.phone,
            a.country_code
           FROM order_address a
           JOIN "order" o ON o.shipping_address_id = a.id
           WHERE o.id = $1`,
          [order.id]
        );

        return {
          id: order.id,
          display_id: order.display_id,
          status: order.status,
          email: order.email,
          currency_code: order.currency_code,
          created_at: order.created_at,
          updated_at: order.updated_at,
          metadata: order.metadata,
          customer: order.customer_id
            ? {
                id: order.customer_id,
                email: order.customer_email,
                first_name: order.first_name,
                last_name: order.last_name,
                phone: order.phone,
              }
            : null,
          shipping_address: addressResult.rows[0] || null,
          items: itemsResult.rows.map((item: any) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            variant_id: item.variant_id,
            product_id: item.product_id,
            sku: item.sku,
            variant_title: item.variant_title,
          })),
        };
      })
    );

    res.json({
      orders,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + orders.length < total,
      },
    });
  } catch (error: any) {
    console.error("[Odoo Orders] Error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};
