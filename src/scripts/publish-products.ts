import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function publishProducts({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve("remoteLink")
  
  console.log("🔍 Finding all products and sales channel...")
  
  // Get all products
  const products = await productModuleService.listProducts({}, {
    relations: ["variants"]
  })
  
  console.log(`Found ${products.length} products`)
  
  // Get default sales channel
  const salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel"
  })
  
  if (!salesChannels.length) {
    console.error("❌ No default sales channel found!")
    return
  }
  
  const defaultChannel = salesChannels[0]
  console.log(`✅ Found sales channel: ${defaultChannel.name} (${defaultChannel.id})`)
  
  // Process each product
  for (const product of products) {
    console.log(`\n📦 ${product.title} (${product.id})`)
    console.log(`   Status: ${product.status}`)
    console.log(`   Variants: ${product.variants?.length || 0}`)
    
    // Add to sales channel
    try {
      console.log(`   ⚠️  Linking to sales channel...`)
      
      await remoteLink.create([{
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [Modules.SALES_CHANNEL]: {
          sales_channel_id: defaultChannel.id,
        },
      }])
      
      console.log(`   ✅ Linked to sales channel!`)
    } catch (error) {
      // Might already be linked
      console.log(`   ℹ️  Link might already exist`)
    }
    
    // Update to published if draft
    if (product.status !== "published") {
      console.log(`   ⚠️  Publishing product...`)
      await productModuleService.updateProducts(product.id, {
        status: "published"
      })
      console.log(`   ✅ Now published!`)
    } else {
      console.log(`   ✅ Already published`)
    }
  }
  
  console.log("\n✅ All products processed!")
}
