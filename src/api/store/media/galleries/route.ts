import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"

// Public: list galleries and their media ids
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mediaService = req.scope.resolve(MEDIA_MODULE) as any
  const [galleries] = await mediaService.listAndCountGalleries({}, { take: 100 })
  const payload: any[] = []
  for (const g of galleries) {
    const media_ids = await mediaService.listGalleryMediaIds(g.id)
    payload.push({ ...g, media_ids })
  }
  res.json({ galleries: payload })
}
