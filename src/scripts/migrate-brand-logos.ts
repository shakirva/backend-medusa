import { ExecArgs } from "@medusajs/framework/types"
import { BRAND_MODULE } from "../modules/brands"

export default async function migrateBrandLogos({ container }: ExecArgs) {
  console.log("Starting brand logo migration: copy 'logo' -> 'logo_url' where missing")
  const brandService = container.resolve(BRAND_MODULE) as any

  const [brands] = await brandService.listAndCountBrands({}, { take: 1000 })
  let updated = 0
  for (const b of brands) {
    try {
      if ((!b.logo_url || b.logo_url === null) && b.logo) {
        await brandService.updateBrands({ id: b.id }, { logo_url: b.logo })
        updated++
        console.log(`Updated brand ${b.id} (${b.name})`) 
      }
    } catch (e: any) {
      console.error(`Failed to update brand ${b.id}:`, e?.message || e)
    }
  }

  console.log(`Migration complete. Updated ${updated} brands.`)
}
