import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /odoo/webhooks/products
 * Webhook for Odoo to push product updates to Medusa
 * 
 * Call this when:
 * - A new product is created in Odoo
 * - A product is updated in Odoo
 * - A product is archived/deleted in Odoo
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    event_type,
    product,
  } = req.body as {
    event_type: "product.created" | "product.updated" | "product.deleted";
    product: {
      odoo_id: number;
      sku: string;              // default_code in Odoo
      name: string;
      description?: string;
      list_price?: number;
      standard_price?: number;  // cost price
      barcode?: string;
      weight?: number;
      category_id?: number;
      category_name?: string;
      active?: boolean;
      image_url?: string;
      qty_available?: number;   // inventory quantity
    };
  };

  // Validate required fields
  if (!event_type || !product || !product.sku) {
    return res.status(400).json({
      type: "invalid_data",
      message: "event_type, product, and product.sku are required",
    });
  }

  console.log(`[Odoo Webhook] Received ${event_type} for product SKU: ${product.sku}`);

  try {
    // Handle different event types
    switch (event_type) {
      case "product.created":
      case "product.updated":
        // Find existing product variant by SKU
        const existingVariant = await pgConnection.raw(
          `SELECT 
            pv.id as variant_id,
            pv.product_id,
            p.title as product_title,
            ii.id as inventory_item_id
           FROM product_variant pv
           JOIN product p ON pv.product_id = p.id
           LEFT JOIN inventory_item ii ON ii.sku = pv.sku
           WHERE pv.sku = $1`,
          [product.sku]
        );

        if (existingVariant.rows && existingVariant.rows.length > 0) {
          const variant = existingVariant.rows[0];

          // Update product title/description if provided
          if (product.name) {
            await pgConnection.raw(
              `UPDATE product 
               SET title = $1, 
                   description = COALESCE($2, description),
                   updated_at = NOW() 
               WHERE id = $3`,
              [product.name, product.description, variant.product_id]
            );
          }

          // Update variant barcode if provided
          if (product.barcode) {
            await pgConnection.raw(
              `UPDATE product_variant 
               SET barcode = $1, updated_at = NOW() 
               WHERE id = $2`,
              [product.barcode, variant.variant_id]
            );
          }

          // Update inventory if quantity provided
          if (product.qty_available !== undefined && variant.inventory_item_id) {
            await pgConnection.raw(
              `UPDATE inventory_level 
               SET stocked_quantity = $1, updated_at = NOW() 
               WHERE inventory_item_id = $2`,
              [product.qty_available, variant.inventory_item_id]
            );
          }

          // Store Odoo metadata
          await pgConnection.raw(
            `INSERT INTO product_variant_metadata (variant_id, key, value)
             VALUES ($1, 'odoo_id', $2)
             ON CONFLICT (variant_id, key) DO UPDATE SET value = EXCLUDED.value`,
            [variant.variant_id, product.odoo_id?.toString()]
          ).catch(() => {
            // Metadata table might not exist, ignore error
          });

          res.json({
            success: true,
            action: "updated",
            product: {
              variant_id: variant.variant_id,
              product_id: variant.product_id,
              sku: product.sku,
            },
          });
        } else {
          // Product doesn't exist in Medusa - log for manual review
          console.log(`[Odoo Webhook] Product SKU ${product.sku} not found in Medusa, creating inventory item only`);

          // Create inventory item for tracking
          const inventoryItemId = `iitem_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await pgConnection.raw(
            `INSERT INTO inventory_item (id, sku, title, description, weight, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (sku) DO UPDATE SET 
               title = EXCLUDED.title,
               description = EXCLUDED.description,
               weight = EXCLUDED.weight,
               updated_at = NOW()`,
            [inventoryItemId, product.sku, product.name, product.description, product.weight]
          );

          // Get default location and create inventory level if quantity provided
          if (product.qty_available !== undefined) {
            const locationResult = await pgConnection.raw(`SELECT id FROM stock_location LIMIT 1`);
            
            if (locationResult.rows && locationResult.rows.length > 0) {
              const locationId = locationResult.rows[0].id;
              const levelId = `iloc_odoo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              // Get actual inventory item id (in case of conflict, it might be different)
              const itemResult = await pgConnection.raw(
                `SELECT id FROM inventory_item WHERE sku = $1`,
                [product.sku]
              );

              if (itemResult.rows && itemResult.rows.length > 0) {
                await pgConnection.raw(
                  `INSERT INTO inventory_level 
                   (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())
                   ON CONFLICT (inventory_item_id, location_id) DO UPDATE SET 
                     stocked_quantity = EXCLUDED.stocked_quantity,
                     updated_at = NOW()`,
                  [levelId, itemResult.rows[0].id, locationId, product.qty_available]
                );
              }
            }
          }

          res.json({
            success: true,
            action: "inventory_created",
            message: "Product not found in catalog, inventory item created for future linking",
            sku: product.sku,
          });
        }
        break;

      case "product.deleted":
        // We don't delete products, just mark inventory as 0
        const inventoryItem = await pgConnection.raw(
          `SELECT id FROM inventory_item WHERE sku = $1`,
          [product.sku]
        );

        if (inventoryItem.rows && inventoryItem.rows.length > 0) {
          await pgConnection.raw(
            `UPDATE inventory_level 
             SET stocked_quantity = 0, updated_at = NOW() 
             WHERE inventory_item_id = $1`,
            [inventoryItem.rows[0].id]
          );
        }

        res.json({
          success: true,
          action: "inventory_zeroed",
          sku: product.sku,
          message: "Product inventory set to 0",
        });
        break;

      default:
        res.status(400).json({
          type: "invalid_data",
          message: `Unknown event_type: ${event_type}`,
        });
    }
  } catch (error: any) {
    console.error("[Odoo Webhook] Product webhook error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * GET /odoo/webhooks/products
 * Health check for webhook endpoint
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "ok",
    endpoint: "products",
    description: "Odoo product webhook endpoint",
    supported_events: ["product.created", "product.updated", "product.deleted"],
    example_payload: {
      event_type: "product.updated",
      product: {
        odoo_id: 123,
        sku: "PROD-001",
        name: "Product Name",
        description: "Product description",
        list_price: 99.99,
        standard_price: 50.00,
        barcode: "1234567890123",
        weight: 0.5,
        category_name: "Electronics",
        active: true,
        qty_available: 100,
      },
    },
  });
};
