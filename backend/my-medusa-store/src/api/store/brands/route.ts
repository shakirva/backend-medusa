import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brands"
import BrandService from "../../../modules/brands/service"

export const AUTHENTICATE = false


/**
 * GET /store/brands
 * List active brands for storefront.
 * Pass ?special=true to return only brands marked as special (for the explore section).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)

  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0
  const specialOnly = req.query.special === "true"

  const filters: Record<string, any> = { is_active: true }
  if (specialOnly) {
    filters.is_special = true
  }

  const [brands, count] = await brandModuleService.listAndCountBrands(
    filters,
    {
      skip: offset,
      take: limit,
      order: { display_order: "ASC", name: "ASC" },
    }
  )
  // Compute product counts per brand
  const enriched = [] as any[]
  for (const b of brands) {
    const productIds = await brandModuleService.listBrandProducts(b.id)
    enriched.push({ ...b, product_count: productIds.length, logo_url: b.logo_url })
  }
  res.json({ brands: enriched, count, limit, offset })
}

