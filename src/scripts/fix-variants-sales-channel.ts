/**
 * Fix Variants - Ensure all products have variants and are linked to sales channel
 * 
 * Some products may have been created without variants or without proper sales channel links.
 * This script ensures every product has at least one variant and is properly linked.
 * 
 * Usage: npx medusa exec ./src/scripts/fix-variants-sales-channel.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function fixVariants({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productService = container.resolve(Modules.PRODUCT)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("🔧 Fixing products without variants and sales channel links...")

  try {
    // Get all products with variants
    const products = await productService.listProducts(
      {},
      {
        relations: ["variants", "options"],
        take: 1000,
      }
    )

    logger.info(`Found ${products.length} products to check`)

    // Get default sales channel
    const salesChannels = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" })
    let defaultChannel = salesChannels[0]
    
    if (!defaultChannel) {
      // Try to get first available sales channel
      const allChannels = await salesChannelService.listSalesChannels({})
      defaultChannel = allChannels[0]
    }
    
    if (!defaultChannel) {
      logger.error("No sales channel found!")
      return
    }
    
    logger.info(`Using sales channel: ${defaultChannel.name} (${defaultChannel.id})`)

    let fixedVariants = 0
    let linkedProducts = 0
    let skippedProducts = 0
    let errors = 0

    for (const product of products) {
      try {
        // Check if product has variants
        const hasVariants = product.variants && product.variants.length > 0
        
        if (!hasVariants) {
          // Create a default variant for this product
          logger.info(`Creating variant for product: ${product.title}`)
          
          // First ensure product has an option
          const options = product.options || []
          if (options.length === 0) {
            // Add default option to product
            await productService.updateProducts(product.id, {
              options: [
                {
                  title: "Default",
                  values: ["Default"]
                }
              ]
            })
          }
          
          // Now create the variant
          const variant = await productService.createProductVariants({
            product_id: product.id,
            title: "Default",
            sku: `${product.handle}-default`,
            manage_inventory: false,
            options: {
              "Default": "Default"
            }
          })
          
          fixedVariants++
          logger.info(`  ✅ Created variant for ${product.title}`)
        }

        // Check if product is linked to sales channel
        const { data: existingLinks } = await query.graph({
          entity: "product_sales_channel",
          fields: ["product_id", "sales_channel_id"],
          filters: { 
            product_id: product.id,
            sales_channel_id: defaultChannel.id
          },
        })

        if (!existingLinks || existingLinks.length === 0) {
          // Link product to sales channel
          await remoteLink.create({
            productService: {
              product_id: product.id,
            },
            salesChannelService: {
              sales_channel_id: defaultChannel.id,
            },
          })
          linkedProducts++
          logger.info(`  📎 Linked ${product.title} to sales channel`)
        } else {
          skippedProducts++
        }
      } catch (error: any) {
        errors++
        logger.error(`Error processing ${product.title}: ${error.message}`)
      }
    }

    logger.info("==================================================")
    logger.info("📊 Fix Summary:")
    logger.info(`   ✅ Variants created: ${fixedVariants}`)
    logger.info(`   📎 Products linked: ${linkedProducts}`)
    logger.info(`   ⏭️  Already OK: ${skippedProducts}`)
    logger.info(`   ❌ Errors: ${errors}`)
    logger.info("==================================================")
  } catch (error: any) {
    logger.error(`Failed to fix variants: ${error.message}`)
    throw error
  }
}
