import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function addProductsToHotDeals({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT) as any

  console.log("🔥 Adding products to Hot Deals collection...")

  // Get the Hot Deals collection
  const collectionsResult = await productService.listProductCollections({ handle: "hot-deals" }, { take: 1 })
  const collections = Array.isArray(collectionsResult) ? collectionsResult[0] : collectionsResult
  const collectionsList = Array.isArray(collections) ? collections : [collections]
  
  console.log("Collections result:", JSON.stringify(collectionsResult, null, 2))
  
  if (!collectionsList || collectionsList.length === 0 || !collectionsList[0]) {
    console.log("❌ Hot Deals collection not found!")
    return
  }

  const hotDealsCollection = collectionsList[0]
  console.log(`✅ Found Hot Deals collection: ${hotDealsCollection.id}`)

  // Get all products - fix the destructuring
  const productsResult = await productService.listProducts({}, { take: 20 })
  console.log("Products result type:", typeof productsResult, Array.isArray(productsResult))
  
  // Handle the [products, count] tuple format
  let productList: any[] = []
  if (Array.isArray(productsResult) && productsResult.length >= 1) {
    productList = Array.isArray(productsResult[0]) ? productsResult[0] : productsResult
  } else {
    productList = productsResult as any[]
  }
  
  console.log(`📦 Found ${productList?.length || 0} total products`)

  if (!productList || productList.length === 0) {
    console.log("❌ No products found!")
    return
  }

  // Take up to 6 products for Hot Deals
  const productsToAdd = productList.slice(0, Math.min(6, productList.length))
  
  console.log(`\n🔗 Linking ${productsToAdd.length} products to Hot Deals...`)

  // Update each product's collection_id
  for (const product of productsToAdd) {
    try {
      await productService.updateProducts(product.id, {
        collection_id: hotDealsCollection.id
      })
      console.log(`   ✅ Linked: ${product.title} (${product.id})`)
    } catch (err: any) {
      console.log(`   ⚠️ Failed to link ${product.title}: ${err.message}`)
    }
  }

  console.log("\n🎉 Hot Deals collection updated successfully!")
  console.log(`   Total products in Hot Deals: ${productsToAdd.length}`)
}
