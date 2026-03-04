import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../../../modules/media"

export const AUTHENTICATE = true

// POST: add media to gallery (expects body { media_id, display_order })
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const gallery_id = req.params.id
    const body = req.body as any
    const media_id = body.media_id
    if (!media_id) return res.status(400).json({ message: 'media_id is required' })
    const item = await mediaService.addMediaToGallery(gallery_id, media_id, body.display_order || 0)
    res.json({ item })
  } catch (e: any) {
    console.error('Add media to gallery error:', e)
    res.status(500).json({ message: e?.message || 'Failed to add media to gallery' })
  }
}
