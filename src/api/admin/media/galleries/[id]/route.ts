import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../../modules/media"

export const AUTHENTICATE = true

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const id = req.params.id
    const body = req.body || {}
    if (typeof mediaService.updateGalleries === 'function') {
      const updated = await mediaService.updateGalleries({ id }, body)
      return res.json({ gallery: updated })
    }
    res.status(501).json({ message: 'Update galleries not supported' })
  } catch (e: any) {
    console.error('Admin gallery PATCH error:', e)
    res.status(500).json({ message: e?.message || 'Failed to update gallery' })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const id = req.params.id
    if (typeof mediaService.deleteGalleries === 'function') {
      await mediaService.deleteGalleries({ id })
      return res.status(204).send()
    }
    res.status(501).json({ message: 'Delete galleries not supported' })
  } catch (e: any) {
    console.error('Admin gallery DELETE error:', e)
    res.status(500).json({ message: e?.message || 'Failed to delete gallery' })
  }
}
