import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"
import { BRAND_MODULE } from "../../../modules/brands"
import BrandService from "../../../modules/brands/service"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const gallery_id = req.query.gallery_id as string | undefined
    let items: any[] = []
    let count = 0

    if (gallery_id) {
      const mediaIds = await mediaService.listGalleryMediaIds(gallery_id)
      if (!mediaIds || !mediaIds.length) return res.json({ media: [], count: 0 })
      const [rows, c] = await mediaService.listAndCountMedia({ id: { $in: mediaIds } }, { take: 200 })
      items = rows || []
      count = c || 0
    } else {
      const [rows, c] = await mediaService.listAndCountMedia({}, { take: 200 })
      items = rows || []
      count = c || 0
    }

    // Build a brand logo map keyed by brand name for O(1) lookup per media item
    const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const [allBrands] = await brandService.listAndCountBrands({}, { take: 200 })
    const brandLogoMap = new Map<string, string | null>()
    for (const b of allBrands) {
      brandLogoMap.set(b.name, b.logo_url ?? null)
    }

    const getOrigin = () => {
      const fromEnv = process.env.MEDUSA_URL
      if (fromEnv) return fromEnv.replace(/\/$/, '')
      return `${(req.headers['x-forwarded-proto'] as string) || (req.protocol as string) || 'http'}://${req.headers.host || 'localhost:9000'}`
    }

    const origin = getOrigin()
    const makeAbsolute = (u: string | null) => {
      if (!u) return null
      if (u.startsWith('http://') || u.startsWith('https://')) return u
      const path = u.startsWith('/') ? u : `/${u}`
      return `${origin}${path}`
    }

    const media = items.map((m: any) => ({
      id: m.id,
      url: makeAbsolute(m.url || null),
      mime_type: m.mime_type || null,
      title: m.title || null,
      title_ar: m.title_ar || null,
      alt_text: m.alt_text || null,
      thumbnail_url: makeAbsolute(m.thumbnail_url || null),
      brand: m.brand || null,
      brand_logo_url: m.brand ? (brandLogoMap.get(m.brand) ?? null) : null,
      views: m.views ?? 0,
      display_order: m.display_order ?? 0,
      is_featured: !!m.is_featured,
      metadata: m.metadata || null,
    }))

    res.json({ media, count })
  } catch (e: any) {
    console.error('Store media GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list media' })
  }
}
