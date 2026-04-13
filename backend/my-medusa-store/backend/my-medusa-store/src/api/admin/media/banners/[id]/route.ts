import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../../modules/media"

export const AUTHENTICATE = true

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const { id } = req.params
    await mediaService.deleteBanner(id)
    res.status(204).send()
  } catch (e: any) {
    console.error("Banner deletion error:", e)
    res.status(500).json({ message: e?.message || "Failed to delete banner" })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const { id } = req.params
    const body = req.body as any
    const banner = await mediaService.updateBanner(id, body)
    res.json({ banner })
  } catch (e: any) {
    console.error("Banner update error:", e)
    res.status(500).json({ message: e?.message || "Failed to update banner" })
  }
}
