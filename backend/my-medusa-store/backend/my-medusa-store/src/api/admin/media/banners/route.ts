import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const [banners, count] = await mediaService.listAndCountBanners({}, { take: 200 })
    res.json({ banners, count })
  } catch (e: any) {
    console.error("Banner list error:", e)
    res.status(500).json({ message: e?.message || "Failed to list banners" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const body = req.body as any
    console.log("Creating banner with data:", body)
    const banner = await mediaService.createBanner(body)
    res.json({ banner })
  } catch (e: any) {
    console.error("Banner creation error:", e)
    res.status(500).json({ message: e?.message || "Failed to create banner" })
  }
}
