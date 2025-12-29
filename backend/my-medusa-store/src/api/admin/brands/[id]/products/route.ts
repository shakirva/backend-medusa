import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../../modules/brands"
import BrandService from "../../../../../modules/brands/service"

export const AUTHENTICATE = false // dev only

/**
 * POST /admin/brands/:id/products
 * Body: { product_id: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
  const body = req.body as { product_id?: string }
  const { product_id } = body
  if (!product_id) {
    return res.status(400).json({ message: "product_id is required" })
  }
  const link = await brandService.addProductToBrand(req.params.id, product_id)
  res.json({ product_brand: link })
}

/**
 * GET /admin/brands/:id/products
 * Returns product ids linked to this brand
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
  const productIds = await brandService.listBrandProducts(req.params.id)
  res.json({ product_ids: productIds })
}
