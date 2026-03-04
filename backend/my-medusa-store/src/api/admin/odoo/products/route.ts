/**
 * Odoo Products Admin API
 * Endpoints for fetching and syncing products from Odoo
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../../modules/odoo-sync/service"

const odooService = new OdooSyncService()

/**
 * GET /admin/odoo/products
 * Fetch products from Odoo
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100
    const offset = parseInt(req.query.offset as string) || 0

    if (!odooService.isConfigured()) {
      res.status(400).json({
        success: false,
        error: "Odoo is not configured. Please set environment variables.",
      })
      return
    }

    const products = await odooService.fetchProducts(limit, offset)
    const productCount = await odooService.getProductCount()

    // Convert to Medusa format
    const medusaProducts = products.map((p) =>
      odooService.convertToMedusaProduct(p)
    )

    res.json({
      success: true,
      data: {
        products: medusaProducts,
        raw_products: products,
        count: products.length,
        total: productCount,
        limit,
        offset,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
