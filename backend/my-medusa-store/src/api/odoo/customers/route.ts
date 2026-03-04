import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /odoo/customers
 * Get customers for Odoo integration
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    limit = "50",
    offset = "0",
    created_after,
    email,
    phone,
  } = req.query as {
    limit?: string;
    offset?: string;
    created_after?: string;
    email?: string;
    phone?: string;
  };

  try {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (created_after) {
      whereClause += ` AND c.created_at >= $${paramIndex++}`;
      params.push(created_after);
    }

    if (email) {
      whereClause += ` AND c.email ILIKE $${paramIndex++}`;
      params.push(`%${email}%`);
    }

    if (phone) {
      whereClause += ` AND c.phone ILIKE $${paramIndex++}`;
      params.push(`%${phone}%`);
    }

    // Get total count
    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total FROM customer c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total) || 0;

    // Get customers
    const customersResult = await pgConnection.raw(
      `SELECT 
        c.id,
        c.email,
        c.first_name,
        c.last_name,
        c.phone,
        c.has_account,
        c.created_at,
        c.updated_at,
        c.metadata
       FROM customer c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get addresses for each customer
    const customers = await Promise.all(
      customersResult.rows.map(async (customer: any) => {
        // Get addresses
        const addressResult = await pgConnection.raw(
          `SELECT 
            a.id,
            a.first_name,
            a.last_name,
            a.address_1,
            a.address_2,
            a.city,
            a.postal_code,
            a.phone,
            a.country_code,
            a.province,
            a.is_default_shipping,
            a.is_default_billing
           FROM customer_address a
           WHERE a.customer_id = $1`,
          [customer.id]
        );

        // Get order count
        const orderCountResult = await pgConnection.raw(
          `SELECT COUNT(*) as count FROM "order" WHERE customer_id = $1`,
          [customer.id]
        );

        // Get total spent
        const totalSpentResult = await pgConnection.raw(
          `SELECT COALESCE(SUM(
            (SELECT SUM(li.unit_price * li.quantity) FROM order_line_item li WHERE li.order_id = o.id)
           ), 0) as total
           FROM "order" o WHERE o.customer_id = $1`,
          [customer.id]
        );

        return {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          has_account: customer.has_account,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          metadata: customer.metadata,
          addresses: addressResult.rows || [],
          stats: {
            order_count: parseInt(orderCountResult.rows[0].count) || 0,
            total_spent: parseFloat(totalSpentResult.rows[0].total) || 0,
          },
        };
      })
    );

    res.json({
      customers,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + customers.length < total,
      },
    });
  } catch (error: any) {
    console.error("[Odoo Customers] Error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};
