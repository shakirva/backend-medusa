import { ExecArgs } from "@medusajs/framework/types"
import { BRAND_MODULE } from "../modules/brands"

// Update brands using WorldVectorLogo CDN - high quality PNG logos
const BRAND_LOGO_UPDATES: Record<string, string> = {
  "apple": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png",
  "samsung": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png",
  "sony": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png",
  "xiaomi": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/200px-Xiaomi_logo_%282021-%29.svg.png",
  "jbl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/JBL_logo.svg/200px-JBL_logo.svg.png",
  "bose": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bose_logo.svg/200px-Bose_logo.svg.png",
  "anker": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Anker_logo.svg/200px-Anker_logo.svg.png",
  "logitech": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Logitech_logo.svg/200px-Logitech_logo.svg.png",
  "ssss": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png",
}

export default async function updateBrandLogos({ container }: ExecArgs) {
  console.log("🔄 Updating Brand Logos to Local Images...")
  console.log("=" .repeat(50))

  try {
    const brandService = container.resolve(BRAND_MODULE) as any
    
    // Get all brands
    const brands = await brandService.listBrands()
    
    console.log(`\n📦 Found ${brands.length} brands to update`)
    
    for (const brand of brands) {
      const slug = brand.slug?.toLowerCase() || brand.name?.toLowerCase().replace(/\s+/g, '-')
      const newLogoUrl = BRAND_LOGO_UPDATES[slug as keyof typeof BRAND_LOGO_UPDATES]
      
      if (newLogoUrl) {
        await brandService.updateBrands({
          id: brand.id,
          logo_url: newLogoUrl
        })
        console.log(`  ✓ Updated ${brand.name}: ${newLogoUrl}`)
      } else {
        // Assign a default logo if not in our map
        await brandService.updateBrands({
          id: brand.id,
          logo_url: "/brands/apple.svg"
        })
        console.log(`  ✓ Updated ${brand.name} with default logo`)
      }
    }
    
    console.log("\n" + "=" .repeat(50))
    console.log("✅ Brand Logos Updated Successfully!")
    console.log("\n🌐 Refresh your frontend at localhost:3000 to see the changes!")
    
  } catch (error) {
    console.error("❌ Error updating brand logos:", error)
    throw error
  }
}
