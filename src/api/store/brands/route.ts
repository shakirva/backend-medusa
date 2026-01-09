import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brands"
import BrandService from "../../../modules/brands/service"

export const AUTHENTICATE = false


/**
 * GET /store/brands
 * List active brands for storefront
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)
  
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0
  
  const [brands, count] = await brandModuleService.listAndCountBrands(
    { is_active: true },
    {
      skip: offset,
      take: limit,
      order: { display_order: "ASC", name: "ASC" },
    }
  )
  // Compute product counts per brand (initial naive implementation; can be optimized later)
  const enriched = [] as any[]
  for (const b of brands) {
    const productIds = await brandModuleService.listBrandProducts(b.id)
    // Keep logo_url as-is since brand logos are hosted in frontend /public/brands/ folder
    // The frontend will serve these directly from its public directory
    const logo = b.logo_url
    // Don't prefix with backend URL - these are frontend-local paths like /brands/apple.svg
    enriched.push({ ...b, product_count: productIds.length, logo_url: logo })
  }
  res.json({ brands: enriched, count, limit, offset })
}
