import { MedusaService } from "@medusajs/framework/utils"
import Brand from "./models/brand"
import ProductBrand from "./models/product-brand"

/**
 * Brand Module Service
 * Handles all business logic for brands including CRUD operations
 */
class BrandService extends MedusaService({
  Brand,
  ProductBrand,
}) {
  async addProductToBrand(brandId: string, productId: string) {
    // Prevent duplicates
    const existing = await this.listProductBrands({ brand_id: brandId, product_id: productId })
    if (existing.length) return existing[0]
    return this.createProductBrands({ brand_id: brandId, product_id: productId })
  }

  async listBrandProducts(brandId: string) {
    const links = await this.listProductBrands({ brand_id: brandId })
    return links.map((l: any) => l.product_id)
  }
}

export default BrandService
