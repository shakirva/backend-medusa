import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"

// Public store endpoint (no admin auth required)
export const AUTHENTICATE = false

/**
 * GET /store/media/banners
 * Optional query: type=hero|dual|triple
 * Returns active banners mapped for storefront: { id, link, media: { url } }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const type = String(req.query.type || "").toLowerCase()

    // Map storefront "type" to our Banner.position values
    // Align with Admin positions seen in UI: hero | dual | triple
    const positionFilter =
      type === "hero" ? "hero" :
      type === "single" ? "single" :
      type === "dual" ? "dual" :
      type === "triple" ? "triple" : undefined

    const where: any = { is_active: true }
    if (positionFilter) where.position = positionFilter

    // Optional: honor schedule
    const nowIso = new Date().toISOString()
    where["$and"] = [
      {
        $or: [
          { start_at: null },
          { start_at: { $lte: nowIso } },
        ],
      },
      {
        $or: [
          { end_at: null },
          { end_at: { $gte: nowIso } },
        ],
      },
    ]

    const [rows] = await mediaService.listAndCountBanners(where, {
      order: { display_order: "ASC" },
      take: 12,
    })

    // Helper to make absolute URLs for backend-hosted static assets
    const getOrigin = () => {
      const fromEnv = process.env.MEDUSA_URL
      if (fromEnv) return fromEnv.replace(/\/$/, '')
      const proto = (req.headers['x-forwarded-proto'] as string) || (req.protocol as string) || 'http'
      const host = req.headers.host || 'localhost:9000'
      return `${proto}://${host}`
    }

    const origin = getOrigin()

    const makeAbsolute = (u: string | null) => {
      if (!u) return null
      if (u.startsWith('http://') || u.startsWith('https://')) return u
      // ensure leading slash
      const path = u.startsWith('/') ? u : `/${u}`
      return `${origin}${path}`
    }

    // Shape for frontend components: media.url (absolute)
    const banners = (rows || []).map((b: any) => ({
      id: b.id,
      link: b.link || null,
      position: b.position || null,
      // Keep legacy field for HeroSlider (absolute)
      image_url: makeAbsolute(b.image_url || null),
      // Also provide normalized media.url for Dual/Triple components (absolute)
      media: { url: makeAbsolute(b.image_url || null) },
      title: b.title || null,
    }))

    res.json({ banners })
  } catch (e: any) {
    console.error("Store banners error:", e)
    res.status(500).json({ message: e?.message || "Failed to fetch banners" })
  }
}
