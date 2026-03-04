/**
 * Odoo Admin API Routes
 * Provides endpoints for managing Odoo integration
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../modules/odoo-sync/service"

// Instantiate the service
const odooService = new OdooSyncService()

/**
 * GET /admin/odoo/status
 * Get Odoo integration status and configuration
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const config = odooService.getConfig()
    const isConfigured = odooService.isConfigured()

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        config: {
          url: config.url || null,
          dbName: config.dbName || null,
          username: config.username || null,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/odoo/status
 * Test connection to Odoo
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const result = await odooService.testConnection()

    res.json({
      success: result.success,
      message: result.message,
      data: result.data,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
