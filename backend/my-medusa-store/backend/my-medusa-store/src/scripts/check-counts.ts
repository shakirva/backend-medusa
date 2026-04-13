/**
 * Check Current Product & Category Counts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function ({ container }: ExecArgs) {
  console.log('📊 Checking current database counts...\n')

  // Get services
  const productModuleService = container.resolve(Modules.PRODUCT)

  try {
    // Count products
    const [products, productCount] = await productModuleService.listAndCountProducts()
    console.log(`📦 Total Products: ${productCount}`)

    // Count variants  
    const [variants, variantCount] = await productModuleService.listAndCountProductVariants()
    console.log(`📋 Total Variants: ${variantCount}`)

    // Sample some recent products
    const recentProducts = await productModuleService.listProducts({}, { take: 5, order: { created_at: 'DESC' } })
    
    console.log('\n🆕 Recent Products:')
    recentProducts.forEach((product: any, i: number) => {
      console.log(`  ${i + 1}. ${product.title} (${product.handle})`)
    })

    console.log('\n✅ Database counts retrieved successfully!')

  } catch (error: any) {
    console.error('❌ Error getting counts:', error.message)
  }
}