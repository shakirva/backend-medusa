import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"

export default async function createSampleVideo({ container }: ExecArgs) {
  console.log('Running sample video creation...')
  const mediaService = container.resolve(MEDIA_MODULE) as any

  // Public sample MP4
  const testUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  const mediaPayload = { url: testUrl, mime_type: 'video/mp4', title: 'Integration Test Video' }

  const created = await (mediaService.createMedia ? mediaService.createMedia(mediaPayload) : mediaService.createMedias(mediaPayload))
  const mediaId = Array.isArray(created) ? created[0]?.id : created?.id
  if (!mediaId) throw new Error('Failed to create media')
  console.log('Created media id:', mediaId)

  // Create gallery
  const galleryPayload = { name: 'video-integration-gallery', slug: `video-integration-${Date.now()}`, description: 'Video integration gallery', thumbnail_url: testUrl }
  const gallery = await (mediaService.createGalleries ? mediaService.createGalleries(galleryPayload) : mediaService.createGallery(galleryPayload))
  const galleryId = Array.isArray(gallery) ? gallery[0]?.id : gallery?.id
  if (!galleryId) throw new Error('Failed to create gallery')
  console.log('Created gallery id:', galleryId)

  // Add media to gallery
  const added = await mediaService.addMediaToGallery(galleryId, mediaId, 0)
  if (!added) throw new Error('Failed to add media to gallery')
  console.log('Added media to gallery')

  // Fetch store endpoint (requires publishable key in env)
  const origin = process.env.MEDUSA_URL || 'http://localhost:9000'
  const key = process.env.MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!key) throw new Error('Publishable key not set in env for integration test')

  const url = `${origin.replace(/\/$/, '')}/store/media?gallery_id=${encodeURIComponent(galleryId)}`
  console.log('Fetching store endpoint:', url)
  const res = await fetch(url, { headers: { 'x-publishable-api-key': key } })
  if (!res.ok) throw new Error(`Store media fetch failed: ${res.status}`)
  const json = await res.json() as { media?: unknown[] }
  console.log('Store media response:', json)
  if (!json.media || json.media.length === 0) throw new Error('Store media returned no items')

  console.log('Sample video creation and verification succeeded')
}
