import { Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../modules/brands"
import { ExecArgs } from "@medusajs/framework/types"

/**
 * Script to link a subset of products to the first brand.
 * Usage: yarn medusa exec link-products-to-brands.ts
 */
export default async function linkProductsToBrand({ container }: ExecArgs) {
  const brandService = container.resolve(BRAND_MODULE) as any
  const productService = container.resolve(Modules.PRODUCT)

  const [brand] = await brandService.listBrands({}, { take: 1 })
  if (!brand) {
    console.log("No brands found; aborting")
    return
  }
  console.log("Using brand:", brand.name, brand.id)

  const products = await productService.listProducts({}, { take: 5 })
  console.log(`Linking up to ${products.length} products to brand...`)

  for (const p of products) {
    try {
      const link = await brandService.addProductToBrand(brand.id, p.id)
      console.log("Linked", p.title, "→", brand.name, link.id)
    } catch (e: any) {
      console.error("Failed linking", p.id, e?.message || e)
    }
  }

  console.log("Done.")
}
