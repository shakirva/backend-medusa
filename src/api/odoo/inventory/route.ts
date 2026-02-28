import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /odoo/inventory
 * Get inventory for Odoo sync
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    limit = "100",
    offset = "0",
    sku,
    low_stock,
    include_products,
  } = req.query as {
    limit?: string;
    offset?: string;
    sku?: string;
    low_stock?: string;
    include_products?: string;
  };

  try {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (sku) {
      whereClause += ` AND ii.sku ILIKE $${paramIndex++}`;
      params.push(`%${sku}%`);
    }

    // Low stock threshold (default 10)
    if (low_stock === "true") {
      const threshold = 10;
      whereClause += ` AND COALESCE(il.stocked_quantity, 0) < $${paramIndex++}`;
      params.push(threshold);
    }

    // Get total count
    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total 
       FROM inventory_item ii
       LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total) || 0;

    // Get inventory items
    const inventoryResult = await pgConnection.raw(
      `SELECT 
        ii.id,
        ii.sku,
        ii.title,
        ii.description,
        ii.origin_country,
        ii.weight,
        ii.created_at,
        ii.updated_at,
        il.id as level_id,
        il.stocked_quantity,
        il.reserved_quantity,
        il.incoming_quantity,
        sl.id as location_id,
        sl.name as location_name
       FROM inventory_item ii
       LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
       LEFT JOIN stock_location sl ON il.location_id = sl.id
       ${whereClause}
       ORDER BY ii.sku
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get product details if requested
    let inventory = inventoryResult.rows;

    if (include_products === "true") {
      inventory = await Promise.all(
        inventoryResult.rows.map(async (item: any) => {
          // Find product variant with this SKU
          const variantResult = await pgConnection.raw(
            `SELECT 
              pv.id as variant_id,
              pv.title as variant_title,
              pv.barcode,
              p.id as product_id,
              p.title as product_title,
              p.handle as product_handle
             FROM product_variant pv
             JOIN product p ON pv.product_id = p.id
             WHERE pv.sku = $1`,
            [item.sku]
          );

          return {
            ...item,
            available_quantity: (item.stocked_quantity || 0) - (item.reserved_quantity || 0),
            product: variantResult.rows[0] || null,
          };
        })
      );
    } else {
      inventory = inventory.map((item: any) => ({
        ...item,
        available_quantity: (item.stocked_quantity || 0) - (item.reserved_quantity || 0),
      }));
    }

    res.json({
      inventory,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + inventory.length < total,
      },
    });
  } catch (error: any) {
    console.error("[Odoo Inventory] Error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * POST /odoo/inventory
 * Batch sync inventory from Odoo
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const { items } = req.body as {
    items: Array<{
      sku: string;
      quantity: number;
      title?: string;
    }>;
  };

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      type: "invalid_data",
      message: "items array is required",
    });
  }

  const results: Array<{
    sku: string;
    status: string;
    previous_quantity?: number;
    new_quantity?: number;
    error?: string;
  }> = [];

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const { sku, quantity, title } = item;

      if (!sku || quantity === undefined) {
        results.push({
          sku: sku || "unknown",
          status: "failed",
          error: "sku and quantity are required",
        });
        failed++;
        continue;
      }

      // Find or create inventory item
      let inventoryItemId: string | null = null;
      let levelId: string | null = null;
      let previousQuantity = 0;

      const existingResult = await pgConnection.raw(
        `SELECT ii.id, il.id as level_id, il.stocked_quantity
         FROM inventory_item ii
         LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
         WHERE ii.sku = $1`,
        [sku]
      );

      if (existingResult.rows && existingResult.rows.length > 0) {
        inventoryItemId = existingResult.rows[0].id;
        levelId = existingResult.rows[0].level_id;
        previousQuantity = existingResult.rows[0].stocked_quantity || 0;
      }

      if (!inventoryItemId) {
        // Create new inventory item
        const newId = `iitem_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await pgConnection.raw(
          `INSERT INTO inventory_item (id, sku, title, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [newId, sku, title || sku]
        );
        inventoryItemId = newId;
      } else if (title) {
        // Update title if provided
        await pgConnection.raw(
          `UPDATE inventory_item SET title = $1, updated_at = NOW() WHERE id = $2`,
          [title, inventoryItemId]
        );
      }

      // Get default location
      const locationResult = await pgConnection.raw(
        `SELECT id FROM stock_location LIMIT 1`
      );

      if (!locationResult.rows || locationResult.rows.length === 0) {
        results.push({
          sku,
          status: "failed",
          error: "No stock location found",
        });
        failed++;
        continue;
      }

      const locationId = locationResult.rows[0].id;

      // Update or create inventory level
      if (levelId) {
        await pgConnection.raw(
          `UPDATE inventory_level 
           SET stocked_quantity = $1, updated_at = NOW() 
           WHERE id = $2`,
          [quantity, levelId]
        );
      } else {
        const newLevelId = `iloc_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await pgConnection.raw(
          `INSERT INTO inventory_level 
           (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())`,
          [newLevelId, inventoryItemId, locationId, quantity]
        );
      }

      results.push({
        sku,
        status: "synced",
        previous_quantity: previousQuantity,
        new_quantity: quantity,
      });
      synced++;
    } catch (error: any) {
      results.push({
        sku: item.sku || "unknown",
        status: "failed",
        error: error.message,
      });
      failed++;
    }
  }

  res.json({
    success: failed === 0,
    summary: {
      total: items.length,
      synced,
      failed,
    },
    results,
  });
};
