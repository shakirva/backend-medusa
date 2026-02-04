/**
 * Create Client Recommended Brands
 * Adds the 6 brands recommended by client: Powerology, Samsung, Apple, Marshall, Porodo, Harman Kardon
 */

import { ExecArgs } from "@medusajs/framework/types"

const CLIENT_BRANDS = [
  {
    name: "Powerology",
    slug: "powerology",
    description: "Premium tech accessories and power solutions",
    logo_url: "https://www.powerology.com/media/logo/stores/1/logo.png",
    is_active: true,
    display_order: 1
  },
  {
    name: "Samsung",
    slug: "samsung",
    description: "World-leading technology and electronics",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png",
    is_active: true,
    display_order: 2
  },
  {
    name: "Apple",
    slug: "apple",
    description: "Think Different - Premium consumer electronics",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/800px-Apple_logo_black.svg.png",
    is_active: true,
    display_order: 3
  },
  {
    name: "Marshall",
    slug: "marshall",
    description: "Legendary audio equipment and speakers",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Marshall_Amplification_logo.svg/2560px-Marshall_Amplification_logo.svg.png",
    is_active: true,
    display_order: 4
  },
  {
    name: "Porodo",
    slug: "porodo",
    description: "Smart lifestyle accessories",
    logo_url: "https://porodo.net/wp-content/uploads/2021/03/porodo-logo.png",
    is_active: true,
    display_order: 5
  },
  {
    name: "Harman Kardon",
    slug: "harman-kardon",
    description: "Premium audio and connected technologies",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Harman_Kardon_logo.svg/2560px-Harman_Kardon_logo.svg.png",
    is_active: true,
    display_order: 6
  }
]

export default async function createClientBrands({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const brandModuleService = container.resolve("brands") as any

  logger.info("🏷️ Creating client recommended brands...")

  let created = 0
  let updated = 0
  let skipped = 0

  for (const brandData of CLIENT_BRANDS) {
    try {
      // Check if brand exists by slug
      const existing = await brandModuleService.listBrands({
        slug: brandData.slug
      })

      if (existing && existing.length > 0) {
        // Update existing brand with new logo
        await brandModuleService.updateBrands(existing[0].id, {
          logo_url: brandData.logo_url,
          description: brandData.description,
          is_active: true,
          display_order: brandData.display_order
        })
        logger.info(`✅ Updated: ${brandData.name}`)
        updated++
      } else {
        // Create new brand
        await brandModuleService.createBrands(brandData)
        logger.info(`✅ Created: ${brandData.name}`)
        created++
      }
    } catch (error: any) {
      logger.warn(`⚠️ Error with ${brandData.name}: ${error.message}`)
      skipped++
    }
  }

  logger.info(`\n📊 Summary:`)
  logger.info(`   Created: ${created}`)
  logger.info(`   Updated: ${updated}`)
  logger.info(`   Skipped: ${skipped}`)
  logger.info(`\n🏷️ Client brands setup complete!`)
}
