import { ExecArgs, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MEDIA_MODULE } from "../modules/media"

// Realistic product images from Unsplash (high-quality, relevant to products)
const PRODUCT_IMAGES = {
  // iPhone / Smartphone images
  iphone: [
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop", // iPhone
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=600&fit=crop", // iPhone Pro
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&h=600&fit=crop", // iPhone side view
  ],
  // MacBook / Laptop images
  macbook: [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop", // MacBook
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop", // Laptop
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop", // Laptop open
  ],
  // AirPods / Headphones images
  airpods: [
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop", // AirPods
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&h=600&fit=crop", // AirPods case
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop", // AirPods Pro
  ],
  // Apple Watch / Smartwatch images
  watch: [
    "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&h=600&fit=crop", // Apple Watch
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop", // Smartwatch
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop", // Watch on wrist
  ],
  // iPad / Tablet images
  ipad: [
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop", // iPad
    "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=600&fit=crop", // iPad Pro
    "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&h=600&fit=crop", // Tablet
  ],
  // Samsung / Android phones
  samsung: [
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop", // Samsung phone
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=600&fit=crop", // Android phone
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop", // Galaxy
  ],
  // Sony / Premium headphones
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop", // Headphones
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop", // Over-ear
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop", // Pro headphones
  ],
  // JBL / Speakers
  speaker: [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop", // Bluetooth speaker
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop", // Portable speaker
    "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=600&h=600&fit=crop", // Speaker
  ],
  // Power banks
  powerbank: [
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // Power bank
    "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=600&h=600&fit=crop", // Portable charger
    "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=600&h=600&fit=crop", // USB charger
  ],
  // Gaming
  gaming: [
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=600&fit=crop", // Gaming setup
    "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=600&h=600&fit=crop", // Gaming gear
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=600&fit=crop", // Controller
  ],
}

// Map product names to image categories
function getImageForProduct(productName: string): string {
  const name = productName.toLowerCase()
  
  if (name.includes('iphone') || name.includes('phone')) {
    return PRODUCT_IMAGES.iphone[Math.floor(Math.random() * PRODUCT_IMAGES.iphone.length)]
  }
  if (name.includes('macbook') || name.includes('laptop')) {
    return PRODUCT_IMAGES.macbook[Math.floor(Math.random() * PRODUCT_IMAGES.macbook.length)]
  }
  if (name.includes('airpods') || name.includes('airpod')) {
    return PRODUCT_IMAGES.airpods[Math.floor(Math.random() * PRODUCT_IMAGES.airpods.length)]
  }
  if (name.includes('watch')) {
    return PRODUCT_IMAGES.watch[Math.floor(Math.random() * PRODUCT_IMAGES.watch.length)]
  }
  if (name.includes('ipad') || name.includes('tablet')) {
    return PRODUCT_IMAGES.ipad[Math.floor(Math.random() * PRODUCT_IMAGES.ipad.length)]
  }
  if (name.includes('samsung') || name.includes('galaxy')) {
    return PRODUCT_IMAGES.samsung[Math.floor(Math.random() * PRODUCT_IMAGES.samsung.length)]
  }
  if (name.includes('headphone') || name.includes('wh-1000') || name.includes('sony')) {
    return PRODUCT_IMAGES.headphones[Math.floor(Math.random() * PRODUCT_IMAGES.headphones.length)]
  }
  if (name.includes('speaker') || name.includes('jbl') || name.includes('flip')) {
    return PRODUCT_IMAGES.speaker[Math.floor(Math.random() * PRODUCT_IMAGES.speaker.length)]
  }
  if (name.includes('power') || name.includes('charger') || name.includes('anker') || name.includes('battery')) {
    return PRODUCT_IMAGES.powerbank[Math.floor(Math.random() * PRODUCT_IMAGES.powerbank.length)]
  }
  if (name.includes('gaming') || name.includes('logitech') || name.includes('controller')) {
    return PRODUCT_IMAGES.gaming[Math.floor(Math.random() * PRODUCT_IMAGES.gaming.length)]
  }
  
  // Default to a random category
  const categories = Object.values(PRODUCT_IMAGES)
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]
  return randomCategory[0]
}

// Media thumbnails for video gallery
const VIDEO_THUMBNAILS = [
  {
    title: "iPhone 17 Pro Unboxing",
    thumbnail: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=450&fit=crop",
  },
  {
    title: "Best Gaming Setup 2026",
    thumbnail: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=800&h=450&fit=crop",
  },
  {
    title: "Headphones Comparison",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop",
  },
  {
    title: "Smart Watch Review",
    thumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=450&fit=crop",
  },
  {
    title: "MacBook Pro M4 Review",
    thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=450&fit=crop",
  },
  {
    title: "Power Bank Buying Guide",
    thumbnail: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=450&fit=crop",
  },
]

export default async function updateProductImages({ container }: ExecArgs) {
  console.log("🖼️ Updating Product Images with Realistic Photos...")
  console.log("=" .repeat(50))

  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)
  
  try {
    // Get all products
    const products = await productService.listProducts({}, { 
      relations: ["images"],
      take: 100 
    })
    
    console.log(`\n📦 Found ${products.length} products to update`)
    
    let updatedCount = 0
    
    for (const product of products) {
      const imageUrl = getImageForProduct(product.title || "")
      
      try {
        // Update product with new thumbnail
        await productService.updateProducts(product.id, {
          thumbnail: imageUrl,
          images: [{ url: imageUrl }]
        })
        console.log(`  ✓ Updated: ${product.title}`)
        updatedCount++
      } catch (error: any) {
        console.log(`  ⚠ Skipped: ${product.title} - ${error.message}`)
      }
    }
    
    // Update media thumbnails
    console.log("\n🎬 Updating Media Thumbnails...")
    try {
      const mediaService = container.resolve(MEDIA_MODULE) as any
      const allMedia = await mediaService.listMedia()
      
      for (let i = 0; i < allMedia.length && i < VIDEO_THUMBNAILS.length; i++) {
        const media = allMedia[i]
        const thumbnail = VIDEO_THUMBNAILS[i]
        
        await mediaService.updateMedia({
          id: media.id,
          title: thumbnail.title,
          thumbnail_url: thumbnail.thumbnail,
        })
        console.log(`  ✓ Updated: ${thumbnail.title}`)
      }
    } catch (error) {
      console.log("  ℹ Media module not available, skipping video updates")
    }
    
    console.log("\n" + "=" .repeat(50))
    console.log(`✅ Updated ${updatedCount} products with realistic images!`)
    console.log("\n🌐 Refresh your frontend at localhost:3000 to see the changes!")
    
  } catch (error) {
    console.error("❌ Error updating products:", error)
    throw error
  }
}
