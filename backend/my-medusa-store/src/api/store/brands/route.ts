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
    // Ensure logo_url is absolute so frontend can fetch directly
    const origin = (process.env.MEDUSA_URL && process.env.MEDUSA_URL.replace(/\/$/, '')) || `${(req.headers['x-forwarded-proto'] as string) || (req.protocol as string) || 'http'}://${req.headers.host || 'localhost:9000'}`
    const logo = b.logo_url
  const absLogo = logo ? (logo.startsWith('http://') || logo.startsWith('https://') ? logo : `${origin}${logo.startsWith('/') ? logo : `/${logo}`}`) : null
    enriched.push({ ...b, product_count: productIds.length, logo_url: absLogo })
  }
  res.json({ brands: enriched, count, limit, offset })
}
