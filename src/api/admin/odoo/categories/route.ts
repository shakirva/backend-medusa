/**
 * Odoo Categories Admin API
 * Endpoints for fetching categories from Odoo
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../../modules/odoo-sync/service"

const odooService = new OdooSyncService()

/**
 * GET /admin/odoo/categories
 * Fetch categories from Odoo
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

    const categories = await odooService.fetchCategories()

    res.json({
      success: true,
      data: {
        categories,
        count: categories.length,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
