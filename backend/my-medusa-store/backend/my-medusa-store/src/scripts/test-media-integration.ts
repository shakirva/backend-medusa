import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"

export default async function testMediaIntegration({ container }: ExecArgs) {
  console.log('Running media integration test...')
  const mediaService = container.resolve(MEDIA_MODULE) as any

  // Create test media
  const testUrl = 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sonos-product-1.webp'
  const mediaPayload = { url: testUrl, mime_type: 'image/webp', title: 'Integration Test Media' }
  const created = await (mediaService.createMedia ? mediaService.createMedia(mediaPayload) : mediaService.createMedias(mediaPayload))
  const mediaId = Array.isArray(created) ? created[0]?.id : created?.id
  if (!mediaId) throw new Error('Failed to create media')

  // Create gallery
  const galleryPayload = { name: 'integration-gallery', slug: `integration-${Date.now()}`, description: 'Integration test gallery', thumbnail_url: testUrl }
  const gallery = await (mediaService.createGalleries ? mediaService.createGalleries(galleryPayload) : mediaService.createGallery(galleryPayload))
  const galleryId = Array.isArray(gallery) ? gallery[0]?.id : gallery?.id
  if (!galleryId) throw new Error('Failed to create gallery')

  // Add media to gallery
  const added = await mediaService.addMediaToGallery(galleryId, mediaId, 0)
  if (!added) throw new Error('Failed to add media to gallery')

  // Fetch store endpoint (requires publishable key in env)
  const origin = process.env.MEDUSA_URL || 'http://localhost:9000'
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.MEDUSA_PUBLISHABLE_KEY
  if (!key) throw new Error('Publishable key not set in env for integration test')

  const url = `${origin.replace(/\/$/, '')}/store/media?gallery_id=${encodeURIComponent(galleryId)}`
  const res = await fetch(url, { headers: { 'x-publishable-api-key': key } })
  if (!res.ok) throw new Error(`Store media fetch failed: ${res.status}`)
  const json = await res.json() as { media?: unknown[] }
  if (!json.media || json.media.length === 0) throw new Error('Store media returned no items')

  console.log('Integration test passed: media returned from store endpoint')
}
