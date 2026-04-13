/**
 * Fix Odoo Products Inventory
 * 
 * This script disables inventory management for products that were imported 
 * from Odoo without proper inventory levels set.
 * 
 * Run with: npx medusa exec ./src/scripts/fix-odoo-inventory.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function fixOdooInventory({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT) as any

  console.log("🔍 Finding variants with inventory management enabled...")

  // Get all product variants with manage_inventory = true
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "manage_inventory", "product_id", "product.id", "product.title"],
    filters: {
      manage_inventory: true
    }
  })

  console.log(`Found ${variants.length} variants with manage_inventory=true`)

  if (variants.length === 0) {
    console.log("No variants need fixing!")
    return
  }

  let fixedCount = 0

  for (const variant of variants) {
    try {
      // Use the product service to update the variant through product update
      // In Medusa v2, we need to update through the product
      const productId = variant.product_id || variant.product?.id
      
      if (!productId) {
        console.error(`❌ No product ID for variant ${variant.id}`)
        continue
      }

      // Update the product's variants
      await productService.updateProducts(productId, {
        variants: [{
          id: variant.id,
          manage_inventory: false
        }]
      })
      
      fixedCount++
      console.log(`✅ Fixed: ${variant.product?.title || 'Unknown'} - ${variant.title}`)
    } catch (error: any) {
      console.error(`❌ Failed to fix variant ${variant.id}: ${error.message}`)
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount}/${variants.length} variants`)
  console.log("Products should now be addable to cart without inventory errors")
}
