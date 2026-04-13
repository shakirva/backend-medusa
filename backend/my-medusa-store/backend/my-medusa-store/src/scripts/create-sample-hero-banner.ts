import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"

export default async function createSampleHeroBanner({ container }: ExecArgs) {
  const mediaService = container.resolve(MEDIA_MODULE) as any
  console.log("🔍 Checking for existing hero banners…")
  const [existing] = await mediaService.listAndCountBanners({ position: "hero" }, { take: 1 })
  if (existing && existing.length) {
    console.log(`ℹ️ A hero banner already exists (id=${existing[0].id}). Skipping create.`)
    return
  }

  console.log("🖼️ Creating sample media record…")
  // Use a public image from Medusa's S3 bucket allowed by Next config
  const media = await mediaService.createMedias({
    url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sonos-product-1.webp",
    mime_type: "image/webp",
    title: "Sample Hero",
    alt_text: "Sample Hero",
  })
  const mediaId = Array.isArray(media) ? media[0]?.id : media?.id
  if (!mediaId) {
    console.error("❌ Failed to create media record")
    return
  }

  console.log("🏷️ Creating hero banner…")
  const banner = await mediaService.createBanners({
    title: "Sample Hero Banner",
    position: "hero",
    is_active: true,
    media_id: mediaId,
    display_order: 0,
  })
  const bannerId = Array.isArray(banner) ? banner[0]?.id : banner?.id
  console.log(`✅ Created hero banner id=${bannerId}`)
}
