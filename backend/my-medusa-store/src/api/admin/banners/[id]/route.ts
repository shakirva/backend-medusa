import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"

export const AUTHENTICATE = true

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const id = req.params.id
    if (!id) {
      return res.status(400).json({ message: "id is required" })
    }

    // Ensure banner exists
    const existing = await mediaService.retrieveBanner(id).catch(() => null)
    if (!existing) {
      return res.status(404).json({ message: "Banner not found" })
    }

    await mediaService.deleteBanners({ id })
    res.status(204).send()
  } catch (e: any) {
    console.error("Banner delete error:", e)
    res.status(500).json({ message: e?.message || "Failed to delete banner" })
  }
}
