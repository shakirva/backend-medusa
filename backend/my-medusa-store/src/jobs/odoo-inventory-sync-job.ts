/**
 * Odoo Inventory Sync Job
 * Automatically syncs inventory levels from Odoo every 15 minutes
 * 
 * This job:
 * 1. Fetches stock quantities from Odoo
 * 2. Updates inventory levels in Medusa
 * 3. Logs results for monitoring
 */

import { MedusaContainer } from "@medusajs/framework/types"
import https from "https"

interface OdooProduct {
  id: number
  default_code: string | false
  qty_available: number
  name: string
}

// Odoo configuration
const ODOO_CONFIG = {
  url: process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com",
  db: process.env.ODOO_DB_NAME || "oskarllc-new-27289548",
  username: process.env.ODOO_USERNAME || "SYG",
  password: process.env.ODOO_PASSWORD || "S123456",
}

async function odooJsonRpc(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
    })

    const url = new URL(ODOO_CONFIG.url)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: "/jsonrpc",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }

    const req = https.request(options, (res) => {
      let body = ""
      res.on("data", (chunk) => (body += chunk))
      res.on("end", () => {
        try {
          const result = JSON.parse(body)
          if (result.error) {
            reject(new Error(result.error.message || "Odoo error"))
          } else {
            resolve(result.result)
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on("error", reject)
    req.write(data)
    req.end()
  })
}

async function authenticateOdoo(): Promise<number> {
  const uid = await odooJsonRpc("call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
  })
  return uid
}

async function fetchOdooInventory(uid: number): Promise<OdooProduct[]> {
  const products = await odooJsonRpc("call", {
    service: "object",
    method: "execute_kw",
    args: [
      ODOO_CONFIG.db,
      uid,
      ODOO_CONFIG.password,
      "product.product",
      "search_read",
      [[["active", "=", true]]],
      {
        fields: ["id", "default_code", "qty_available", "name"],
        limit: 1000,
      },
    ],
  })
  return products || []
}

export default async function odooInventorySyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  
  logger.info("📦 [Inventory Job] Starting Odoo inventory sync...")
  
  try {
    // Authenticate with Odoo
    const uid = await authenticateOdoo()
    if (!uid) {
      logger.warn("[Inventory Job] Could not authenticate with Odoo")
      return
    }
    
    // Fetch inventory from Odoo
    const odooProducts = await fetchOdooInventory(uid)
    logger.info(`[Inventory Job] Fetched ${odooProducts.length} products from Odoo`)
    
    // Build SKU to inventory map
    const odooInventory = new Map<string, { qty: number, odooId: number, name: string }>()
    for (const product of odooProducts) {
      const sku = product.default_code || `ODOO-${product.id}`
      odooInventory.set(sku, {
        qty: Math.max(0, Math.floor(product.qty_available)),
        odooId: product.id,
        name: product.name
      })
    }
    
    // Get services
    const productModuleService = container.resolve("product")
    const inventoryModuleService = container.resolve("inventory")
    const stockLocationService = container.resolve("stock_location")
    
    // Get existing products with variants
    const existingProducts = await productModuleService.listProducts({}, {
      select: ["id", "handle", "metadata"],
      relations: ["variants"],
      take: 1000
    })
    
    // Get inventory items
    const inventoryItems = await inventoryModuleService.listInventoryItems({}, { take: 2000 })
    const inventoryItemMap = new Map<string, any>()
    for (const item of inventoryItems) {
      if (item.sku) {
        inventoryItemMap.set(item.sku, item)
      }
    }
    
    // Get default location
    const locations = await stockLocationService.listStockLocations({})
    if (locations.length === 0) {
      logger.warn("[Inventory Job] No stock locations found")
      return
    }
    const location = locations[0]
    
    // Update inventory levels
    let updatedCount = 0
    let errorCount = 0
    
    for (const product of existingProducts) {
      for (const variant of product.variants || []) {
        const sku = variant.sku
        if (!sku) continue
        
        const odooStock = odooInventory.get(sku)
        if (!odooStock) continue
        
        try {
          const inventoryItem = inventoryItemMap.get(sku)
          if (!inventoryItem) continue
          
          // Get or create inventory level
          const levels = await inventoryModuleService.listInventoryLevels({
            inventory_item_id: inventoryItem.id,
            location_id: location.id
          })
          
          if (levels.length > 0) {
            await inventoryModuleService.updateInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: location.id,
              stocked_quantity: odooStock.qty
            })
          } else {
            await inventoryModuleService.createInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: location.id,
              stocked_quantity: odooStock.qty
            })
          }
          
          updatedCount++
        } catch (error: any) {
          errorCount++
          if (errorCount <= 5) {
            logger.warn(`[Inventory Job] Error updating ${sku}: ${error.message}`)
          }
        }
      }
    }
    
    logger.info(`✅ [Inventory Job] Completed: ${updatedCount} updated, ${errorCount} errors`)
    
  } catch (error: any) {
    logger.error(`[Inventory Job] Error: ${error.message}`)
  }
}

// Job configuration - run every 15 minutes
export const config = {
  name: "odoo-inventory-sync",
  schedule: "*/15 * * * *", // Every 15 minutes
}
