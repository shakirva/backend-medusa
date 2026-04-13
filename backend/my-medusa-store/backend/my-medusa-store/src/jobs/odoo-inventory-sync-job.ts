/**
 * Odoo Inventory Sync Job (v2 — Extended Fields)
 *
 * Runs every 15 minutes. Syncs inventory quantities from Odoo
 * including qty_available, forecasted_qty, incoming_qty, outgoing_qty.
 *
 * Uses the OdooSyncService for consistent Odoo communication.
 */

import { MedusaContainer } from "@medusajs/framework/types"
import OdooSyncService from "../modules/odoo-sync/service"

interface OdooVariantStock {
  id: number
  default_code: string | false
  name: string
  qty_available: number
  virtual_available: number
  incoming_qty: number
  outgoing_qty: number
  free_qty: number
}

const STOCK_FIELDS = [
  "id",
  "default_code",
  "name",
  "qty_available",
  "virtual_available",
  "incoming_qty",
  "outgoing_qty",
  "free_qty",
]

export default async function odooInventorySyncJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  logger.info("📦 [Inventory Job] Starting Odoo inventory sync...")

  const odoo = new OdooSyncService()
  if (!odoo.isConfigured()) {
    logger.warn("⚠️  Odoo not configured, skipping inventory sync")
    return
  }

  try {
    const authOk = await odoo.authenticate()
    if (!authOk) {
      logger.warn("[Inventory Job] Could not authenticate with Odoo")
      return
    }

    // Fetch all active product variants with stock fields
    const odooVariants: OdooVariantStock[] = await odoo.fetchVariantStock(1000)

    logger.info(
      `[Inventory Job] Fetched ${odooVariants.length} variants from Odoo`
    )

    // Build SKU → stock map
    const odooInventory = new Map<
      string,
      {
        qty: number
        forecasted: number
        incoming: number
        outgoing: number
        freeQty: number
        odooId: number
        name: string
      }
    >()
    for (const v of odooVariants) {
      const sku =
        typeof v.default_code === "string"
          ? v.default_code
          : `ODOO-${v.id}`
      odooInventory.set(sku, {
        qty: Math.max(0, Math.floor(v.qty_available)),
        forecasted: Math.max(0, Math.floor(v.virtual_available)),
        incoming: Math.max(0, Math.floor(v.incoming_qty)),
        outgoing: Math.max(0, Math.floor(v.outgoing_qty)),
        freeQty: Math.max(0, Math.floor(v.free_qty)),
        odooId: v.id,
        name: v.name,
      })
    }

    // Get Medusa services
    const productModuleService = container.resolve("product")
    const inventoryModuleService = container.resolve("inventory")
    const stockLocationService = container.resolve("stock_location")

    // Get existing products with variants
    const existingProducts = await productModuleService.listProducts(
      {},
      {
        select: ["id", "handle", "metadata"],
        relations: ["variants"],
        take: 5000,
      }
    )

    // Get inventory items
    const inventoryItems = await inventoryModuleService.listInventoryItems(
      {},
      { take: 5000 }
    )
    const inventoryItemMap = new Map<string, any>()
    for (const item of inventoryItems) {
      if (item.sku) inventoryItemMap.set(item.sku, item)
    }

    // Get default location
    const locations = await stockLocationService.listStockLocations({})
    if (locations.length === 0) {
      logger.warn("[Inventory Job] No stock locations found")
      return
    }
    const location = locations[0]

    let updatedCount = 0
    let metadataUpdated = 0
    let errorCount = 0

    for (const product of existingProducts) {
      for (const variant of product.variants || []) {
        const sku = variant.sku
        if (!sku) continue

        const odooStock = odooInventory.get(sku)
        if (!odooStock) continue

        try {
          // 1) Update Medusa inventory levels
          const inventoryItem = inventoryItemMap.get(sku)
          if (inventoryItem) {
            const levels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: location.id,
            })

            if (levels.length > 0) {
              await inventoryModuleService.updateInventoryLevels({
                inventory_item_id: inventoryItem.id,
                location_id: location.id,
                stocked_quantity: odooStock.qty,
              })
            } else {
              await inventoryModuleService.createInventoryLevels({
                inventory_item_id: inventoryItem.id,
                location_id: location.id,
                stocked_quantity: odooStock.qty,
              })
            }
            updatedCount++
          }

          // 2) Also store extended stock info in product metadata
          const existingMeta = (product.metadata as Record<string, any>) || {}
          const stockMeta = {
            ...existingMeta,
            stock_qty: odooStock.qty,
            stock_forecasted: odooStock.forecasted,
            stock_incoming: odooStock.incoming,
            stock_outgoing: odooStock.outgoing,
            stock_free_qty: odooStock.freeQty,
            stock_synced_at: new Date().toISOString(),
          }

          // Only update metadata if stock values changed
          if (
            existingMeta.stock_qty !== odooStock.qty ||
            existingMeta.stock_forecasted !== odooStock.forecasted
          ) {
            await productModuleService.updateProducts(product.id, {
              metadata: stockMeta,
            })
            metadataUpdated++
          }
        } catch (error: any) {
          errorCount++
          if (errorCount <= 5) {
            logger.warn(
              `[Inventory Job] Error updating ${sku}: ${error.message}`
            )
          }
        }
      }
    }

    logger.info(
      `✅ [Inventory Job] Completed: ${updatedCount} levels updated, ${metadataUpdated} metadata updated, ${errorCount} errors`
    )
  } catch (error: any) {
    logger.error(`[Inventory Job] Error: ${error.message}`)
  }
}

// Job configuration — run every 15 minutes
export const config = {
  name: "odoo-inventory-sync",
  schedule: "*/15 * * * *",
}
