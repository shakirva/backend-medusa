import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const [galleries, count] = await mediaService.listAndCountGalleries({}, { take: 200 })
    res.json({ galleries: galleries || [], count: count || 0 })
  } catch (e: any) {
    console.error('Admin galleries GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list galleries' })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const body = req.body || {}
    const created = await mediaService.createGalleries(body)
    res.json({ gallery: created })
  } catch (e: any) {
    console.error('Admin galleries POST error:', e)
    res.status(500).json({ message: e?.message || 'Failed to create gallery' })
  }
}
