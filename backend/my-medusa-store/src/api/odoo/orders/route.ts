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

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      whereClause += ` AND o.status IN (${statuses.map(() => `?`).join(",")})`;
      params.push(...statuses);
    }

    // Filter by date range
    if (date_from) {
      whereClause += ` AND o.created_at >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ` AND o.created_at <= ?`;
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
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get order items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order: any) => {
        // Get line items (MedusaJS 2.x: order_item links order to order_line_item)
        // Also fetch odoo_id from product metadata for Odoo matching
        const itemsResult = await pgConnection.raw(
          `SELECT 
            li.id,
            li.title,
            oi.quantity,
            li.unit_price,
            li.variant_id,
            li.product_id,
            li.variant_sku as sku,
            li.variant_title,
            p.metadata->>'odoo_id' as odoo_product_id,
            p.metadata->>'odoo_sku' as odoo_sku,
            pv.barcode
           FROM order_item oi
           JOIN order_line_item li ON oi.item_id = li.id
           LEFT JOIN product p ON p.id = li.product_id
           LEFT JOIN product_variant pv ON pv.id = li.variant_id
           WHERE oi.order_id = ?`,
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
           WHERE o.id = ?`,
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
            unit_price_kwd: item.unit_price ? Number(item.unit_price) / 1000 : 0,
            variant_id: item.variant_id,
            product_id: item.product_id,
            sku: item.sku,
            barcode: item.barcode || null,
            variant_title: item.variant_title,
            // Odoo matching fields — use these to find the product in Odoo
            odoo_product_id: item.odoo_product_id ? Number(item.odoo_product_id) : null,
            odoo_sku: item.odoo_sku || null,
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
