import { BRAND_MODULE } from "../modules/brands"

export default async function fixBrandLogos({ container }: { container: any }) {
  const brandService = container.resolve(BRAND_MODULE)

  // Working logo URLs - using logo.clearbit.com which provides clean brand logos
  const logoMap: Record<string, string> = {
    "apple": "https://logo.clearbit.com/apple.com",
    "samsung": "https://logo.clearbit.com/samsung.com",
    "sony": "https://logo.clearbit.com/sony.com",
    "jbl": "https://logo.clearbit.com/jbl.com",
    "bose": "https://logo.clearbit.com/bose.com",
    "anker": "https://logo.clearbit.com/anker.com",
    "logitech": "https://logo.clearbit.com/logitech.com",
    "xiaomi": "https://logo.clearbit.com/mi.com",
  }

  // Get all brands
  const brands = await brandService.listBrands({}, { take: 100 })
  
  console.log(`Found ${brands.length} brands:\n`)
  
  for (const brand of brands) {
    const brandId = brand.id
    const slug = brand.slug?.toLowerCase() || brand.name?.toLowerCase().replace(/\s+/g, '-')
    const newLogo = logoMap[slug]
    
    console.log(`- ${brand.name} (id: ${brandId}, slug: ${slug})`)
    console.log(`  Current: ${brand.logo_url}`)
    
    if (newLogo && brandId) {
      try {
        await brandService.updateBrands({ id: brandId }, { logo_url: newLogo })
        console.log(`  ✓ Updated to: ${newLogo}`)
      } catch (e: any) {
        console.error(`  ✗ Failed: ${e?.message || e}`)
      }
    } else if (!newLogo) {
      console.log(`  ⚠ No logo mapping for: ${slug}`)
    }
    console.log("")
  }

  console.log("Done!")
}
