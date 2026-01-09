import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Script to add products to the "Best in Power Banks" collection
 * Run with: npx medusa exec src/scripts/seed-best-in-powerbanks.ts
 */
export default async function seedBestInPowerbanks({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)

  // Best in Power Banks collection ID
  const POWERBANKS_COLLECTION_ID = "pcol_01KD30MPNBJA9Y94TPFDR9TXBM"

  // Product IDs to add to the Power Banks collection
  // Using some of the valid products
  const productIds = [
    "prod_01KAARY0K50J8DGR8W7BYPASJ8", // Medusa Sweatpants
    "prod_01KAARY0K5MWH3PEK5MQYCWC54", // Medusa Shorts
    "prod_01KAATY408F97TC9FAZ5BG34KA", // Shakir
  ]

  console.log("Adding products to Best in Power Banks collection...")

  for (const productId of productIds) {
    try {
      await productService.updateProducts(productId, {
        collection_id: POWERBANKS_COLLECTION_ID,
      })
      console.log(`✓ Added ${productId} to Power Banks collection`)
    } catch (error: any) {
      console.error(`✗ Failed to add ${productId}:`, error.message)
    }
  }

  console.log("\nDone! Products added to Best in Power Banks collection.")
}
