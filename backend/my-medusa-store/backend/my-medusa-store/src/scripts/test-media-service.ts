import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"
import MediaService from "../modules/media/service"

export default async function testMediaService({ container }: ExecArgs) {
  console.log("Testing Media Service...")
  
  try {
    const mediaService = container.resolve<MediaService>(MEDIA_MODULE)
    console.log("✓ Media service resolved successfully")
    
    // Test listing media (should return empty array initially)
  const [media, count] = await mediaService.listAndCountMedia({}, { skip: 0, take: 10 })
    console.log(`✓ listAndCountMedia works: found ${count} media items`)
    
    // Test creating a media item
    const testMedia = {
      url: "http://localhost:9000/static/uploads/test.jpg",
      mime_type: "image/jpeg",
      title: "Test Media",
      alt_text: "Test image"
    }
    
    const created = await mediaService.createMedia(testMedia)
    console.log("✓ createMedia works:", created.id)
    
    // Test listing after creation
    const [newMedia, newCount] = await mediaService.listAndCountMedia({}, { skip: 0, take: 10 })
    console.log(`✓ After creation: found ${newCount} media items`)
    
    console.log("✅ All media service tests passed!")
    
  } catch (error: any) {
    console.error("❌ Media service test failed:", error.message)
    console.error("Stack:", error.stack)
    throw error
  }
}