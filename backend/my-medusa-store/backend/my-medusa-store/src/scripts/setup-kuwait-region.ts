/**
 * Setup Kuwait Region with KWD currency
 * 
 * Usage: npx medusa exec ./src/scripts/setup-kuwait-region.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function setupKuwaitRegion({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const regionService = container.resolve(Modules.REGION)
  const storeService = container.resolve(Modules.STORE)

  logger.info("🇰🇼 Setting up Kuwait region with KWD currency...")

  try {
    // Check for existing Kuwait region
    const existingRegions = await regionService.listRegions({})
    const kuwaitRegion = existingRegions.find(r => 
      r.currency_code === "kwd" || 
      r.name?.toLowerCase().includes("kuwait")
    )

    if (kuwaitRegion) {
      logger.info(`Kuwait region already exists: ${kuwaitRegion.name} (${kuwaitRegion.id})`)
      return
    }

    // Create Kuwait region
    logger.info("Creating Kuwait region...")
    const [region] = await regionService.createRegions([{
      name: "Kuwait",
      currency_code: "kwd",
      countries: ["kw"],
    }])

    logger.info(`✅ Kuwait region created: ${region.id}`)
    logger.info(`   Name: ${region.name}`)
    logger.info(`   Currency: ${region.currency_code.toUpperCase()}`)

    // Update store default region (optional)
    try {
      const stores = await storeService.listStores({})
      if (stores.length > 0) {
        await storeService.updateStores(stores[0].id, {
          default_region_id: region.id,
        })
        logger.info(`✅ Set ${region.name} as default store region`)
      }
    } catch (storeError: any) {
      logger.warn(`Could not update default store region: ${storeError.message}`)
    }

    logger.info("=".repeat(50))
    logger.info("🇰🇼 Kuwait region setup complete!")
    logger.info("   Currency: KWD (Kuwaiti Dinar)")
    logger.info("   Country: Kuwait (KW)")
    logger.info("=".repeat(50))

  } catch (error: any) {
    logger.error(`Failed to setup Kuwait region: ${error.message}`)
    throw error
  }
}
