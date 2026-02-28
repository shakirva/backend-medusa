import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"
import { BRAND_MODULE } from "../../../../modules/brands"
import BrandService from "../../../../modules/brands/service"

export const AUTHENTICATE = false

/**
 * GET /store/media/videos
 * Returns video media items for the MediaGallery component
 * Query params:
 *   - limit: number (default 10)
 *   - offset: number (default 0)
 *   - featured: boolean (filter featured videos only)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any

    const limit = parseInt(req.query.limit as string) || 10
    const offset = parseInt(req.query.offset as string) || 0
    const featured = req.query.featured === 'true'

    // Get all media and filter for videos
    const [allItems, totalCount] = await mediaService.listAndCountMedia({}, {
      take: 200,
      order: { display_order: 'ASC' }
    })

    // Filter for video mime types on the application side
    let items = (allItems || []).filter((m: any) =>
      m.mime_type && m.mime_type.startsWith('video')
    )

    if (featured) {
      items = items.filter((m: any) => m.is_featured === true)
    }

    // Apply pagination
    const count = items.length
    items = items.slice(offset, offset + limit)

    // Build brand logo map keyed by brand name
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

    const videos = items.map((m: any) => ({
      id: m.id,
      url: makeAbsolute(m.url || null),
      videoUrl: makeAbsolute(m.url || null), // Alias for frontend compatibility
      mime_type: m.mime_type || null,
      title: m.title || null,
      title_ar: m.title_ar || null,
      titleAr: m.title_ar || null, // Alias for frontend compatibility
      alt_text: m.alt_text || null,
      thumbnail: makeAbsolute(m.thumbnail_url || null),
      thumbnail_url: makeAbsolute(m.thumbnail_url || null),
      brand: m.brand || 'Markasouq',
      brand_logo_url: m.brand ? (brandLogoMap.get(m.brand) ?? null) : null,
      views: m.views || 0,
      display_order: m.display_order || 0,
      is_featured: m.is_featured || false,
      metadata: m.metadata || null,
    }))

    res.json({ videos, count })
  } catch (e: any) {
    console.error('Store videos GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list videos' })
  }
}
