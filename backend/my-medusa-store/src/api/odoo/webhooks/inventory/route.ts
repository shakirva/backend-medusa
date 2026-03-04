import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /odoo/webhooks/inventory
 * Webhook for Odoo to push inventory updates to Medusa
 * 
 * Call this when:
 * - Stock is received in Odoo warehouse
 * - Stock adjustment is made
 * - Products are manufactured
 * - Inter-warehouse transfer happens
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    event_type,
    items,
  } = req.body as {
    event_type: "inventory.updated" | "inventory.adjustment" | "stock.received" | "stock.transfer";
    items: Array<{
      sku: string;              // default_code in Odoo
      odoo_product_id?: number;
      quantity: number;         // New absolute quantity OR adjustment delta
      adjustment_type?: "absolute" | "delta";  // Default: absolute
      warehouse_name?: string;
      reason?: string;
    }>;
  };

  // Validate required fields
  if (!event_type || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      type: "invalid_data",
      message: "event_type and items array are required",
    });
  }

  console.log(`[Odoo Webhook] Received ${event_type} for ${items.length} items`);

  const results: Array<{
    sku: string;
    status: "success" | "failed" | "not_found";
    previous_quantity?: number;
    new_quantity?: number;
    error?: string;
  }> = [];

  let processed = 0;
  let failed = 0;
  let notFound = 0;

  try {
    for (const item of items) {
      const { sku, quantity, adjustment_type = "absolute" } = item;

      if (!sku || quantity === undefined) {
        results.push({
          sku: sku || "unknown",
          status: "failed",
          error: "sku and quantity are required",
        });
        failed++;
        continue;
      }

      // Find inventory item by SKU
      const inventoryResult = await pgConnection.raw(
        `SELECT 
          ii.id as inventory_item_id,
          il.id as level_id,
          il.stocked_quantity,
          il.reserved_quantity,
          il.location_id
         FROM inventory_item ii
         LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
         WHERE ii.sku = $1`,
        [sku]
      );

      if (!inventoryResult.rows || inventoryResult.rows.length === 0) {
        // Inventory item doesn't exist - create it
        const newItemId = `iitem_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await pgConnection.raw(
          `INSERT INTO inventory_item (id, sku, title, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [newItemId, sku, sku]
        );

        // Get default location
        const locationResult = await pgConnection.raw(`SELECT id FROM stock_location LIMIT 1`);
        
        if (locationResult.rows && locationResult.rows.length > 0) {
          const locationId = locationResult.rows[0].id;
          const newLevelId = `iloc_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await pgConnection.raw(
            `INSERT INTO inventory_level 
             (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
             VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())`,
            [newLevelId, newItemId, locationId, quantity]
          );

          results.push({
            sku,
            status: "success",
            previous_quantity: 0,
            new_quantity: quantity,
          });
          processed++;
        } else {
          results.push({
            sku,
            status: "failed",
            error: "No stock location found",
          });
          failed++;
        }
        continue;
      }

      const inventoryItem = inventoryResult.rows[0];
      const previousQuantity = inventoryItem.stocked_quantity || 0;

      // Calculate new quantity based on adjustment type
      let newQuantity: number;
      if (adjustment_type === "delta") {
        // Delta adjustment (add/subtract from current)
        newQuantity = Math.max(0, previousQuantity + quantity);
      } else {
        // Absolute value (replace current)
        newQuantity = Math.max(0, quantity);
      }

      if (inventoryItem.level_id) {
        // Update existing inventory level
        await pgConnection.raw(
          `UPDATE inventory_level 
           SET stocked_quantity = $1, updated_at = NOW() 
           WHERE id = $2`,
          [newQuantity, inventoryItem.level_id]
        );
      } else {
        // Create inventory level if it doesn't exist
        const locationResult = await pgConnection.raw(`SELECT id FROM stock_location LIMIT 1`);
        
        if (locationResult.rows && locationResult.rows.length > 0) {
          const locationId = locationResult.rows[0].id;
          const newLevelId = `iloc_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await pgConnection.raw(
            `INSERT INTO inventory_level 
             (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
             VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())`,
            [newLevelId, inventoryItem.inventory_item_id, locationId, newQuantity]
          );
        }
      }

      results.push({
        sku,
        status: "success",
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
      });
      processed++;
    }

    res.json({
      success: failed === 0,
      event_type,
      summary: {
        total: items.length,
        processed,
        failed,
        not_found: notFound,
      },
      results,
    });
  } catch (error: any) {
    console.error("[Odoo Webhook] Inventory webhook error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * GET /odoo/webhooks/inventory
 * Health check for webhook endpoint
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "ok",
    endpoint: "inventory",
    description: "Odoo inventory webhook endpoint",
    supported_events: ["inventory.updated", "inventory.adjustment", "stock.received", "stock.transfer"],
    example_payload: {
      event_type: "inventory.updated",
      items: [
        {
          sku: "PROD-001",
          odoo_product_id: 123,
          quantity: 50,
          adjustment_type: "absolute",
          warehouse_name: "Main Warehouse",
          reason: "Stock received from supplier",
        },
        {
          sku: "PROD-002",
          quantity: -5,
          adjustment_type: "delta",
          reason: "Manual adjustment",
        },
      ],
    },
  });
};
