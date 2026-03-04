import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brands"
import BrandService from "../../../../modules/brands/service"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"

/**
 * GET /store/brands/:slug
 * Get a single active brand by slug for storefront
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)

  const [items] = await brandModuleService.listAndCountBrands({
    slug: req.params.slug,
    is_active: true,
  }, { take: 1 })

  if (!items || items.length === 0) {
    return res.status(404).json({
      message: "Brand not found",
    })
  }
  const brand = items[0]
  const productIds = await brandModuleService.listBrandProducts(brand.id)
  let products: any[] = []
  if (productIds.length) {
    const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
    products = await productService.listProducts({ id: productIds })
  }
  res.json({ brand, products })
}
