import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /admin/inventory/reduce-stock
 * Reduce stock when order is fulfilled (called by Odoo)
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { items, order_id, reason } = req.body as {
    items: Array<{ sku: string; quantity: number }>;
    order_id?: string;
    reason?: string;
  };

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      type: "invalid_data",
      message: "items array is required",
    });
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const results: Array<{
    sku: string;
    status: string;
    previous_quantity?: number;
    new_quantity?: number;
    reduced_by?: number;
    error?: string;
  }> = [];

  let success_count = 0;
  let failed_count = 0;
  let insufficient_stock_count = 0;

  for (const item of items) {
    try {
      const { sku, quantity } = item;

      if (!sku || !quantity || quantity <= 0) {
        results.push({
          sku: sku || "unknown",
          status: "failed",
          error: "sku and positive quantity are required",
        });
        failed_count++;
        continue;
      }

      // Find inventory item by SKU with current stock
      const inventoryResult = await pgConnection.raw(
        `SELECT ii.id, ii.sku, ii.title, il.id as level_id, il.stocked_quantity, il.reserved_quantity
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
        failed_count++;
        continue;
      }

      const inventoryItem = inventoryResult.rows[0];
      const currentStock = inventoryItem.stocked_quantity || 0;

      // Check if enough stock
      if (currentStock < quantity) {
        results.push({
          sku,
          status: "insufficient_stock",
          previous_quantity: currentStock,
          error: `Requested to reduce ${quantity} but only ${currentStock} available`,
        });
        insufficient_stock_count++;
        continue;
      }

      const newQuantity = currentStock - quantity;

      // Update inventory level
      if (inventoryItem.level_id) {
        await pgConnection.raw(
          `UPDATE inventory_level SET stocked_quantity = ?, updated_at = NOW() WHERE id = ?`,
          [newQuantity, inventoryItem.level_id]
        );

        results.push({
          sku,
          status: "reduced",
          previous_quantity: currentStock,
          new_quantity: newQuantity,
          reduced_by: quantity,
        });
        success_count++;
      } else {
        results.push({
          sku,
          status: "failed",
          error: "No inventory level found for this item",
        });
        failed_count++;
      }
    } catch (error: any) {
      results.push({
        sku: item.sku || "unknown",
        status: "failed",
        error: error.message,
      });
      failed_count++;
    }
  }

  // Log the operation
  console.log(`[Stock Reduction] Order: ${order_id || "N/A"}, Reason: ${reason || "N/A"}`);
  console.log(`[Stock Reduction] Success: ${success_count}, Failed: ${failed_count}, Insufficient: ${insufficient_stock_count}`);

  res.json({
    success: failed_count === 0 && insufficient_stock_count === 0,
    order_id: order_id || null,
    reason: reason || "stock_reduction",
    summary: {
      total_items: items.length,
      successful: success_count,
      failed: failed_count,
      insufficient_stock: insufficient_stock_count,
    },
    results,
  });
};
