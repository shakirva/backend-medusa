import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../modules/odoo-sync/service"

export const AUTHENTICATE = false

const ODOO_BASE_URL = "https://oskarllc-new-27289548.dev.odoo.com"
const odooService = new OdooSyncService()

/**
 * GET /store/brands
 * Fetches brands live from Odoo. Logo URLs point directly to Odoo image endpoint.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const odooBrands = await odooService.fetchBrands()

    const brands = odooBrands
      .filter((b: any) => b.logo) // only include brands that have a logo set in Odoo
      .map((b: any, index: number) => ({
        id: `odoo_brand_${b.id}`,
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: b.description || "",
        logo_url: `${ODOO_BASE_URL}/web/image/product.brand/${b.id}/logo`,
        banner_url: "",
        is_active: true,
        is_special: true,
        display_order: index + 1,
        product_count: 0,
        odoo_id: b.id,
      }))
      .slice(offset, offset + limit)

    res.json({ brands, count: brands.length, limit, offset })
  } catch (err: any) {
    console.error("Brands API error:", err.message)
    res.status(500).json({ error: "Failed to fetch brands from Odoo", message: err.message })
  }
}

