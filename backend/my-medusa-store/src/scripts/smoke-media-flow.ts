import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"

export default async function smokeMediaFlow({ container }: ExecArgs) {
  console.log("Starting smoke media flow...")
  const mediaService = container.resolve(MEDIA_MODULE) as any

  // 1) create a media item using a public image so we don't rely on upload
  const testUrl = "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sonos-product-1.webp"
  const mediaPayload = { url: testUrl, mime_type: 'image/webp', title: 'Smoke Test Media', alt_text: 'Smoke test' }
  const created = await mediaService.createMedia ? await mediaService.createMedia(mediaPayload) : await mediaService.createMedias(mediaPayload)
  const mediaId = Array.isArray(created) ? created[0]?.id : created?.id
  console.log(`Created media id=${mediaId}`)

  // 2) create a gallery
  const galleryPayload = { name: 'smoke-gallery', slug: 'smoke-gallery', description: 'Smoke test gallery', thumbnail_url: testUrl }
  const gallery = await mediaService.createGalleries ? await mediaService.createGalleries(galleryPayload) : await mediaService.createGallery(galleryPayload)
  const galleryId = Array.isArray(gallery) ? gallery[0]?.id : gallery?.id
  console.log(`Created gallery id=${galleryId}`)

  // 3) add media to gallery
  const added = await mediaService.addMediaToGallery(galleryId, mediaId, 0)
  console.log('Added media to gallery:', !!added)

  // 4) query the store endpoint for the gallery (via local http)
  try {
    const origin = process.env.MEDUSA_URL || 'http://localhost:9000'
    const url = `${origin.replace(/\/$/, '')}/store/media?gallery_id=${encodeURIComponent(galleryId)}`
    console.log('Fetching store media URL:', url)
    const res = await fetch(url)
    const json = await res.json()
    console.log('Store media response:', JSON.stringify(json, null, 2))
  } catch (e: any) {
    console.error('Failed to GET store/media:', e?.message || e)
  }

  console.log('Smoke media flow complete')
}
