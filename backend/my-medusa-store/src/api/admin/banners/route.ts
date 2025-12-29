import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const limit = Number(req.query.limit ?? 20)
    const offset = Number(req.query.offset ?? 0)
    const [banners, count] = await mediaService.listAndCountBanners({}, { take: limit, skip: offset })
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
    // Expect: { position, title?, link?, is_active, image_url }
    if (!body?.image_url) {
      return res.status(400).json({ message: "image_url is required" })
    }
    if (!body?.position) {
      return res.status(400).json({ message: "position is required" })
    }
    const [created] = await mediaService.createBanners([
      {
        position: body.position,
        title: body.title ?? null,
        link: body.link ?? null,
        is_active: body.is_active ?? true,
        image_url: body.image_url,
      },
    ])
    res.json({ banner: created })
  } catch (e: any) {
    console.error("Banner creation error:", e)
    res.status(500).json({ message: e?.message || "Failed to create banner" })
  }
}
