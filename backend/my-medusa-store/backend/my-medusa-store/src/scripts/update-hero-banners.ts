/**
 * Update ALL Banners with proper e-commerce images
 * Run: npx medusa exec src/scripts/update-hero-banners.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"

export default async function updateAllBanners({ container }: ExecArgs) {
  const mediaService = container.resolve(MEDIA_MODULE) as any

  console.log("🎯 Updating ALL Banners with proper e-commerce images...")

  // Delete ALL existing banners
  try {
    const [existingBanners] = await mediaService.listAndCountBanners({}, { take: 100 })
    
    if (existingBanners && existingBanners.length > 0) {
      console.log(`🗑️  Deleting ${existingBanners.length} existing banners...`)
      for (const banner of existingBanners) {
        await mediaService.deleteBanners({ id: banner.id })
        console.log(`   ❌ Deleted: ${banner.id} - ${banner.title || banner.position}`)
      }
    }
  } catch (e) {
    console.log("⚠️  Could not delete existing banners")
  }

  // ALL BANNERS - Professional e-commerce images for MarkaSouq
  const allBanners = [
    // ============ HERO BANNERS (Top Slider) ============
    {
      position: "hero",
      title: "Latest Smartphones",
      link: "/en/categories/smart-phones",
      image_url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1600&h=700&fit=crop&q=80",
      is_active: true,
      display_order: 1,
      metadata: { subtitle: "iPhone, Samsung Galaxy & Premium Android Phones" },
    },
    {
      position: "hero",
      title: "Power Banks Collection",
      link: "/en/categories/power-banks",
      image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1600&h=700&fit=crop&q=80",
      is_active: true,
      display_order: 2,
      metadata: { subtitle: "Never Run Out of Power - Up to 50% Off" },
    },
    {
      position: "hero",
      title: "Gaming Accessories",
      link: "/en/categories/gaming",
      image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1600&h=700&fit=crop&q=80",
      is_active: true,
      display_order: 3,
      metadata: { subtitle: "Controllers, Headsets & Gaming Gear" },
    },
    {
      position: "hero",
      title: "Premium Headphones",
      link: "/en/categories/headphones",
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=700&fit=crop&q=80",
      is_active: true,
      display_order: 4,
      metadata: { subtitle: "Sony, Bose, JBL - Crystal Clear Audio" },
    },
    {
      position: "hero",
      title: "Smart Watches",
      link: "/en/categories/smart-watches",
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=700&fit=crop&q=80",
      is_active: true,
      display_order: 5,
      metadata: { subtitle: "Apple Watch, Samsung Galaxy Watch & More" },
    },

    // ============ SINGLE BANNER (Wide Banner) ============
    {
      position: "single",
      title: "Mega Electronics Sale",
      link: "/en/categories/electronics",
      image_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&h=500&fit=crop&q=80",
      is_active: true,
      display_order: 1,
      metadata: { subtitle: "Up to 70% Off on Premium Electronics" },
    },

    // ============ DUAL BANNERS (Two Tiles) ============
    {
      position: "dual",
      title: "Power Up Your Space",
      link: "/en/categories/power-banks",
      image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop&q=80",
      is_active: true,
      display_order: 1,
      metadata: { subtitle: "Premium Power Banks & Chargers" },
    },
    {
      position: "dual",
      title: "Audio Excellence",
      link: "/en/categories/headphones",
      image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=600&fit=crop&q=80",
      is_active: true,
      display_order: 2,
      metadata: { subtitle: "Wireless Earbuds & Headphones" },
    },

    // ============ TRIPLE BANNERS (Three Tiles) ============
    {
      position: "triple",
      title: "Smart Tech",
      link: "/en/categories/smart-watches",
      image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=400&fit=crop&q=80",
      is_active: true,
      display_order: 1,
      metadata: { subtitle: "Smartwatches & Fitness Trackers" },
    },
    {
      position: "triple",
      title: "Gaming Zone",
      link: "/en/categories/gaming",
      image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop&q=80",
      is_active: true,
      display_order: 2,
      metadata: { subtitle: "Gaming Accessories & Controllers" },
    },
    {
      position: "triple",
      title: "Mobile Accessories",
      link: "/en/categories/mobile-accessories",
      image_url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&h=400&fit=crop&q=80",
      is_active: true,
      display_order: 3,
      metadata: { subtitle: "Cases, Chargers & More" },
    },
  ]

  // Create all banners
  console.log("\n✨ Creating new banners...")
  
  for (const banner of allBanners) {
    try {
      const [created] = await mediaService.createBanners([banner])
      console.log(`   ✅ [${banner.position.toUpperCase()}] ${created.id} - ${banner.title}`)
    } catch (e: any) {
      console.error(`   ❌ Failed to create banner "${banner.title}":`, e.message)
    }
  }

  console.log("\n🎉 All banners updated successfully!")
  console.log("📌 Total banners created: " + allBanners.length)
  console.log("   - Hero (Top Slider): 5")
  console.log("   - Single (Wide Banner): 1")
  console.log("   - Dual (Two Tiles): 2")
  console.log("   - Triple (Three Tiles): 3")
  console.log("\n📌 Refresh your admin dashboard at http://localhost:9000/app/banners")
  console.log("📌 Refresh your frontend at http://localhost:3000")
}
