/**
 * Odoo Inventory Admin API
 * Endpoints for fetching and syncing inventory from Odoo
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../../modules/odoo-sync/service"

const odooService = new OdooSyncService()

/**
 * GET /admin/odoo/inventory
 * Fetch inventory/stock levels from Odoo
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    if (!odooService.isConfigured()) {
      res.status(400).json({
        success: false,
        error: "Odoo is not configured. Please set environment variables.",
      })
      return
    }

    const inventory = await odooService.fetchInventory()

    // Group inventory by product
    const inventoryByProduct = inventory.reduce((acc, quant) => {
      const productId = quant.product_id[0]
      const productName = quant.product_id[1]
      
      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          product_name: productName,
          total_quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          locations: [],
        }
      }
      
      acc[productId].total_quantity += quant.quantity
      acc[productId].reserved_quantity += quant.reserved_quantity
      acc[productId].available_quantity +=
        quant.quantity - quant.reserved_quantity
      acc[productId].locations.push({
        location_id: quant.location_id[0],
        location_name: quant.location_id[1],
        quantity: quant.quantity,
        reserved: quant.reserved_quantity,
      })
      
      return acc
    }, {} as Record<number, any>)

    res.json({
      success: true,
      data: {
        inventory: Object.values(inventoryByProduct),
        raw_inventory: inventory,
        count: inventory.length,
        product_count: Object.keys(inventoryByProduct).length,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
