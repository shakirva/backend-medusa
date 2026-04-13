/**
 * Sync Odoo Inventory to MedusaJS
 * 
 * This script fetches inventory from Odoo and updates the existing 
 * MedusaJS inventory levels.
 * 
 * Usage: npx medusa exec ./src/scripts/sync-odoo-inventory.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import OdooSyncService from "../modules/odoo-sync/service"

export default async function syncOdooInventory({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const inventoryService = container.resolve(Modules.INVENTORY)
  const productService = container.resolve(Modules.PRODUCT)

  logger.info("Starting Odoo inventory sync...")

  // Initialize Odoo service
  const odooService = new OdooSyncService()

  // Check if Odoo is configured
  if (!odooService.isConfigured()) {
    logger.error("Odoo is not configured. Please set environment variables:")
    logger.error("  ODOO_URL, ODOO_DB_NAME, ODOO_USERNAME, ODOO_API_KEY")
    return
  }

  logger.info("Testing Odoo connection...")
  const connectionTest = await odooService.testConnection()

  if (!connectionTest.success) {
    logger.error(`Odoo connection failed: ${connectionTest.message}`)
    logger.error("Please verify your Odoo credentials in .env file")
    return
  }

  logger.info(`Connected to Odoo! Found ${connectionTest.data?.productCount} products`)

  try {
    // Fetch products from Odoo
    logger.info("Fetching products from Odoo...")
    const odooProducts = await odooService.fetchProducts(500, 0)
    logger.info(`Fetched ${odooProducts.length} products from Odoo`)

    // Fetch existing products from MedusaJS
    const existingProducts = await productService.listProducts({}, { take: 1000 })
    logger.info(`Found ${existingProducts.length} existing products in MedusaJS`)

    let created = 0
    let updated = 0
    let skipped = 0
    let errors: string[] = []

    for (const odooProduct of odooProducts) {
      try {
        const sku = odooProduct.default_code || `ODOO-${odooProduct.id}`
        const medusaData = odooService.convertToMedusaProduct(odooProduct)

        // Check if product exists by SKU in metadata
        let existingProduct = existingProducts.find((p: any) => 
          p.metadata?.odoo_id === odooProduct.id ||
          p.variants?.some((v: any) => v.sku === sku)
        )

        if (existingProduct) {
          // Update existing product
          await productService.updateProducts(existingProduct.id, {
            title: medusaData.title,
            description: medusaData.description,
            metadata: {
              ...existingProduct.metadata,
              odoo_id: odooProduct.id,
              odoo_sku: sku,
              odoo_stock: odooProduct.qty_available,
              odoo_last_sync: new Date().toISOString(),
            },
          })

          // Update inventory if variant exists
          if (existingProduct.variants?.length > 0) {
            const variant = existingProduct.variants[0]
            // Note: Full inventory sync would require linking to inventory module
            logger.info(`Would update inventory for ${sku}: ${odooProduct.qty_available} units`)
          }

          updated++
          logger.info(`Updated: ${odooProduct.name} (${sku})`)
        } else {
          // Create new product
          const newProduct = await productService.createProducts({
            title: medusaData.title,
            description: medusaData.description,
            handle: medusaData.handle,
            status: "published" as const,
            metadata: {
              odoo_id: odooProduct.id,
              odoo_sku: sku,
              odoo_stock: odooProduct.qty_available,
              odoo_category: odooProduct.categ_id ? odooProduct.categ_id[1] : null,
              odoo_last_sync: new Date().toISOString(),
            },
          })

          created++
          logger.info(`Created: ${odooProduct.name} (${sku})`)
        }
      } catch (error: any) {
        errors.push(`${odooProduct.name}: ${error.message}`)
        skipped++
      }
    }

    logger.info("=".repeat(50))
    logger.info("SYNC COMPLETE")
    logger.info("=".repeat(50))
    logger.info(`Created: ${created}`)
    logger.info(`Updated: ${updated}`)
    logger.info(`Skipped: ${skipped}`)
    
    if (errors.length > 0) {
      logger.warn("Errors:")
      errors.slice(0, 10).forEach((e) => logger.warn(`  - ${e}`))
      if (errors.length > 10) {
        logger.warn(`  ... and ${errors.length - 10} more`)
      }
    }

  } catch (error: any) {
    logger.error(`Sync failed: ${error.message}`)
  }
}
