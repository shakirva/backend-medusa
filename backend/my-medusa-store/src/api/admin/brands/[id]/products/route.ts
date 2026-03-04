import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../../modules/brands"
import BrandService from "../../../../../modules/brands/service"

export const AUTHENTICATE = false

/**
 * POST /admin/brands/:id/products
 * Body: { product_id: string }
 * Links a product to a brand
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

/**
 * DELETE /admin/brands/:id/products
 * Body: { product_id: string }
 * Unlinks a product from a brand
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const body = req.body as { product_id?: string }
    const { product_id } = body
    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" })
    }
    // Find the product_brand record and delete it
    const links = await brandService.listProductBrands({
      brand_id: req.params.id,
      product_id,
    })
    if (!links.length) {
      return res.status(404).json({ message: "Product not linked to this brand" })
    }
    // Prefer soft-delete (respects deleted_at column in schema), fall back to hard-delete
    if (typeof (brandService as any).softDeleteProductBrands === "function") {
      await (brandService as any).softDeleteProductBrands([links[0].id])
    } else {
      await brandService.deleteProductBrands({ id: links[0].id })
    }
    res.status(200).json({ success: true, message: "Product unlinked from brand" })
  } catch (e: any) {
    console.error("Admin brand unlink product error:", e)
    res.status(500).json({ message: e?.message || "Failed to unlink product" })
  }
}
