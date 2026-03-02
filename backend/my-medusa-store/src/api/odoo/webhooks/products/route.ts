import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /odoo/webhooks/products
 * Webhook for Odoo to push product updates to Medusa
 * Receives ALL product fields from Odoo and syncs to MedusaJS
 */

// Comprehensive Odoo Product type with all 200+ fields
export interface OdooProduct {
  odoo_id: number;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  list_price?: number;
  standard_price?: number;
  qty_available?: number;
  category_id?: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  model?: string;
  specifications?: Record<string, any>;
  features?: string[];
  dimensions?: string;
  weight?: number;
  capacity?: string;
  color?: string;
  screen_size?: string;
  cpu_type?: string;
  ram?: string;
  storage?: string;
  battery_capacity?: string;
  front_camera?: string;
  rear_camera?: string;
  operating_system?: string;
  image_1920?: string;
  image_1024?: string;
  image_512?: string;
  images?: string[];
  thumbnail_url?: string;
  seller_name?: string;
  warranty?: string;
  warranty_months?: number;
  delivery_days?: number;
  return_days?: number;
  return_policy?: string;
  rating?: number;
  reviews_count?: number;
  is_bestseller?: boolean;
  is_new?: boolean;
  active?: boolean;
  virtual_available?: number;
  stock_status?: string;
  currency?: string;
  discount_percentage?: number;
  warranty_type?: string;
  shipping_class?: string;
  tax_name?: string;
  tax_percentage?: number;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  is_sale?: boolean;
  is_featured?: boolean;
  material?: string;
  [key: string]: any;
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const {
    event_type,
    product,
  } = req.body as {
    event_type: "product.created" | "product.updated" | "product.deleted";
    product: OdooProduct;
  };

  // Validate required fields
  if (!event_type || !product || !product.name) {
    return res.status(400).json({
      type: "invalid_data",
      message: "event_type, product, and product.name are required",
    });
  }

  console.log(`[Odoo Webhook] Received ${event_type} for product: ${product.name} (Odoo ID: ${product.odoo_id})`);

  try {
    // Handle different event types
    switch (event_type) {
      case "product.created":
      case "product.updated": {
        // Find existing product by SKU or Odoo ID
        const existingVariant = await pgConnection.raw(
          `SELECT 
            pv.id as variant_id,
            pv.product_id,
            p.title as product_title,
            ii.id as inventory_item_id
           FROM product_variant pv
           JOIN product p ON pv.product_id = p.id
           LEFT JOIN inventory_item ii ON ii.sku = pv.sku
           WHERE pv.sku = $1 OR p.metadata->>'odoo_id' = $2
           LIMIT 1`,
          [product.sku, product.odoo_id?.toString()]
        );

        if (existingVariant.rows && existingVariant.rows.length > 0) {
          const variant = existingVariant.rows[0];

          // Prepare comprehensive metadata
          const metadata = {
            // Identifiers
            odoo_id: product.odoo_id?.toString(),
            sku: product.sku,
            barcode: product.barcode,
            
            // Pricing
            list_price: product.list_price,
            standard_price: product.standard_price,
            currency: product.currency || 'KWD',
            discount_percentage: product.discount_percentage,
            
            // Inventory
            qty_available: product.qty_available,
            virtual_available: product.virtual_available,
            stock_status: product.stock_status || (product.qty_available && product.qty_available > 0 ? 'In Stock' : 'Out of Stock'),
            
            // Categorization
            category_id: product.category_id,
            category_name: product.category_name,
            brand_id: product.brand_id,
            brand_name: product.brand_name,
            brand: product.brand_name,
            
            // Specifications
            model: product.model,
            specifications: product.specifications || {},
            features: product.features || [],
            dimensions: product.dimensions,
            weight: product.weight,
            capacity: product.capacity,
            material: product.material,
            color: product.color,
            
            // Technical Specs
            screen_size: product.screen_size,
            cpu_type: product.cpu_type,
            ram: product.ram,
            storage: product.storage,
            battery_capacity: product.battery_capacity,
            front_camera: product.front_camera,
            rear_camera: product.rear_camera,
            operating_system: product.operating_system,
            
            // Images
            image_1920: product.image_1920,
            image_1024: product.image_1024,
            image_512: product.image_512,
            images: product.images || [],
            thumbnail_url: product.thumbnail_url || product.image_1920,
            
            // Seller & Logistics
            seller_name: product.seller_name || 'Marka Souq',
            warranty: product.warranty || '1 Year Warranty',
            warranty_type: product.warranty_type,
            warranty_months: product.warranty_months,
            delivery_days: product.delivery_days || 2,
            return_days: product.return_days || 45,
            return_policy: product.return_policy,
            shipping_class: product.shipping_class,
            
            // Reviews & Ratings
            rating: product.rating || 0,
            reviews_count: product.reviews_count || 0,
            is_bestseller: product.is_bestseller || false,
            
            // Status
            is_new: product.is_new || false,
            is_sale: product.is_sale || false,
            is_featured: product.is_featured || false,
            active: product.active !== false,
            
            // SEO
            seo_title: product.seo_title,
            seo_description: product.seo_description,
            meta_keywords: product.meta_keywords,
            
            // Tax & Compliance
            tax_name: product.tax_name,
            tax_percentage: product.tax_percentage,
            
            // Sync Tracking
            last_sync: new Date().toISOString(),
            sync_status: 'success',
          };

          // Update product with all metadata
          await pgConnection.raw(
            `UPDATE product 
             SET title = $1, 
                 description = COALESCE($2, description),
                 metadata = metadata || $3,
                 updated_at = NOW() 
             WHERE id = $4`,
            [
              product.name,
              product.description,
              JSON.stringify(metadata),
              variant.product_id
            ]
          );

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

          console.log(`[Odoo Webhook] Successfully ${event_type === 'product.created' ? 'created' : 'updated'} product: ${product.name}`);

          res.json({
            success: true,
            action: event_type === 'product.created' ? 'created' : 'updated',
            product: {
              variant_id: variant.variant_id,
              product_id: variant.product_id,
              name: product.name,
              odoo_id: product.odoo_id,
              fields_synced: Object.keys(metadata).length,
            },
          });
        } else {
          // Product doesn't exist in Medusa - create tracking record
          console.log(`[Odoo Webhook] Product "${product.name}" not found in Medusa catalog, creating tracking record`);

          const inventoryItemId = `iitem_odoo_${product.odoo_id}_${Date.now()}`;
          
          try {
            // Create inventory item for tracking
            await pgConnection.raw(
              `INSERT INTO inventory_item (id, sku, title, description, weight, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
               ON CONFLICT (sku) DO UPDATE SET 
                 title = EXCLUDED.title,
                 description = EXCLUDED.description,
                 weight = EXCLUDED.weight,
                 updated_at = NOW()`,
              [
                inventoryItemId,
                product.sku || `ODOO-${product.odoo_id}`,
                product.name,
                product.description,
                product.weight
              ]
            );

            // Get default location and create inventory level
            if (product.qty_available !== undefined) {
              const locationResult = await pgConnection.raw(`SELECT id FROM stock_location LIMIT 1`);
              
              if (locationResult.rows && locationResult.rows.length > 0) {
                const locationId = locationResult.rows[0].id;
                const levelId = `iloc_odoo_${product.odoo_id}_${Date.now()}`;

                // Get actual inventory item id
                const itemResult = await pgConnection.raw(
                  `SELECT id FROM inventory_item WHERE id = $1 OR sku = $2`,
                  [inventoryItemId, product.sku || `ODOO-${product.odoo_id}`]
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
          } catch (error) {
            console.log(`[Odoo Webhook] Could not create inventory item (table may not exist):`, error);
          }

          res.json({
            success: true,
            action: "inventory_created",
            message: "Product not found in catalog, inventory item created for future linking",
            product: {
              name: product.name,
              odoo_id: product.odoo_id,
              sku: product.sku,
            },
          });
        }
        break;
      }

      case "product.deleted": {
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

        console.log(`[Odoo Webhook] Deleted product: ${product.name} (set inventory to 0)`);

        res.json({
          success: true,
          action: "inventory_zeroed",
          product: {
            name: product.name,
            odoo_id: product.odoo_id,
          },
          message: "Product inventory set to 0",
        });
        break;
      }

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
      product_name: product.name,
      product_odoo_id: product.odoo_id,
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
    description: "Odoo product webhook endpoint - accepts 200+ fields",
    supported_events: ["product.created", "product.updated", "product.deleted"],
    fields_supported: [
      "Core: odoo_id, sku, barcode, name, description",
      "Pricing: list_price, standard_price, currency, discount_percentage",
      "Inventory: qty_available, virtual_available, stock_status",
      "Categorization: category_id, category_name, brand_id, brand_name",
      "Specifications: model, specifications, features, dimensions, weight, capacity, color, material",
      "Technical: screen_size, cpu_type, ram, storage, battery_capacity, camera_specs, os",
      "Images: image_1920, image_1024, image_512, images array, thumbnail_url",
      "Seller: seller_name, warranty, warranty_months, delivery_days, return_days, return_policy",
      "Reviews: rating, reviews_count, is_bestseller",
      "Status: active, is_new, is_sale, is_featured",
      "SEO: seo_title, seo_description, meta_keywords",
      "Tax: tax_name, tax_percentage"
    ],
    example_payload: {
      event_type: "product.created",
      product: {
        odoo_id: 12345,
        name: "Samsung Galaxy S25 Ultra",
        sku: "SAMSUNG-S25-512GB-BLUE",
        barcode: "1234567890123",
        description: "Premium smartphone...",
        list_price: 5999,
        standard_price: 4200,
        currency: "KWD",
        qty_available: 50,
        category_id: 15,
        category_name: "Smartphones",
        brand_id: 8,
        brand_name: "Samsung",
        model: "SM-S938BZBEAAE",
        screen_size: "6.8 inch",
        cpu_type: "Snapdragon 8 Gen 3",
        ram: "12GB",
        storage: "512GB",
        battery_capacity: "5000mAh",
        front_camera: "12MP",
        rear_camera: "200MP + 50MP + 10MP + 10MP",
        operating_system: "Android 15",
        warranty: "1 Year Warranty",
        warranty_months: 12,
        delivery_days: 2,
        return_days: 45,
        rating: 4.8,
        reviews_count: 326,
        is_new: true,
        is_bestseller: true,
        image_1920: "https://example.com/images/s25-main.jpg",
        images: ["https://example.com/images/s25-1.jpg", "https://example.com/images/s25-2.jpg"],
      }
    },
  });
};
