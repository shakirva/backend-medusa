import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Link products in Apple collection to Apple brand
 */
export default async function linkAppleProducts({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const brandsModuleService: any = container.resolve("brands")
  const productModuleService = container.resolve(Modules.PRODUCT)
  
  // Get Apple brand
  const appleBrands = await brandsModuleService.listBrands({ slug: "apple" })
  
  if (!appleBrands || appleBrands.length === 0) {
    logger.error("Apple brand not found!")
    return
  }
  
  const appleBrand = appleBrands[0]
  logger.info(`Found Apple brand: ${appleBrand.id}`)
  
  // Get all products that have "Apple" collection or have Apple-related titles
  const allProducts = await productModuleService.listProducts({}, { take: 200 })
  
  const appleProducts = allProducts.filter((p: any) => {
    const title = (p.title || "").toLowerCase()
    const collectionTitle = (p.collection?.title || "").toLowerCase()
    
    // Products in Apple collection
    if (collectionTitle === "apple") return true
    
    // Products with Apple product names
    if (title.includes("iphone") || title.includes("ipad") || title.includes("airpods") || title.includes("macbook") || title.includes("apple watch")) return true
    
    return false
  })
  
  logger.info(`Found ${appleProducts.length} Apple products to link`)
  
  let linked = 0
  for (const product of appleProducts) {
    try {
      await brandsModuleService.addProductToBrand(appleBrand.id, product.id)
      logger.info(`✅ Linked: ${product.title}`)
      linked++
    } catch (e: any) {
      // Already linked or error
      if (!e.message?.includes("already")) {
        logger.warn(`⚠️ Error linking ${product.title}: ${e.message}`)
      }
    }
  }
  
  logger.info(`\n📊 Linked ${linked} products to Apple brand`)
  
  // Verify
  const linkedProductIds = await brandsModuleService.listBrandProducts(appleBrand.id)
  logger.info(`Apple brand now has ${linkedProductIds.length} products linked`)
}
