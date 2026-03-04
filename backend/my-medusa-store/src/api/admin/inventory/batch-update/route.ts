import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /admin/inventory/batch-update
 * Batch update inventory stock quantities from Odoo
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { updates } = req.body as {
    updates: Array<{ sku: string; stocked_quantity: number }>;
  };

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      type: "invalid_data",
      message: "updates array is required",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const results: Array<{
    sku: string;
    status: string;
    stocked_quantity?: number;
    error?: string;
  }> = [];

  let updated = 0;
  let failed = 0;

  for (const update of updates) {
    try {
      const { sku, stocked_quantity } = update;

      if (!sku || stocked_quantity === undefined) {
        results.push({
          sku: sku || "unknown",
          status: "failed",
          error: "sku and stocked_quantity are required",
        });
        failed++;
        continue;
      }

      // Find inventory item by SKU
      const inventoryResult = await pgConnection.raw(
        `SELECT ii.id, il.id as level_id, il.stocked_quantity 
         FROM inventory_item ii 
         LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id 
         WHERE ii.sku = ?`,
        [sku]
      );

      if (!inventoryResult.rows || inventoryResult.rows.length === 0) {
        results.push({
          sku,
          status: "failed",
          error: "Inventory item not found",
        });
        failed++;
        continue;
      }

      const inventoryItem = inventoryResult.rows[0];

      // Update inventory level
      if (inventoryItem.level_id) {
        await pgConnection.raw(
          `UPDATE inventory_level SET stocked_quantity = ? WHERE id = ?`,
          [stocked_quantity, inventoryItem.level_id]
        );
      } else {
        // Create inventory level if not exists
        const locationResult = await pgConnection.raw(
          `SELECT id FROM stock_location LIMIT 1`
        );
        
        if (locationResult.rows && locationResult.rows.length > 0) {
          const locationId = locationResult.rows[0].id;
          await pgConnection.raw(
            `INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, 0, NOW(), NOW())`,
            [`iloc_${Date.now()}`, inventoryItem.id, locationId, stocked_quantity]
          );
        }
      }

      results.push({
        sku,
        status: "updated",
        stocked_quantity,
      });
      updated++;
    } catch (error: any) {
      results.push({
        sku: update.sku || "unknown",
        status: "failed",
        error: error.message,
      });
      failed++;
    }
  }

  res.json({
    success: failed === 0,
    updated,
    failed,
    results,
  });
};
