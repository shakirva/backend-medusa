import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../../../../modules/media"

export const AUTHENTICATE = true

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const gallery_id = req.params.id
    const media_id = req.params.mediaId
    if (!gallery_id || !media_id) return res.status(400).json({ message: 'gallery and media id required' })

    if (typeof mediaService.deleteGalleryMedias === 'function') {
      await mediaService.deleteGalleryMedias({ gallery_id, media_id })
      return res.status(204).send()
    }

    // fallback: try generic delete
    if (typeof mediaService.delete === 'function') {
      await mediaService.delete(media_id)
      return res.status(204).send()
    }

    res.status(501).json({ message: 'Delete media from gallery not supported' })
  } catch (e: any) {
    console.error('Remove media from gallery error:', e)
    res.status(500).json({ message: e?.message || 'Failed to remove media from gallery' })
  }
}
