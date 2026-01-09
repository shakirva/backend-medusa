import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"

// Admin endpoints require authentication
export const AUTHENTICATE = true

/**
 * GET /admin/media
 * Query: limit, offset
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const limit = Number(req.query.limit || 50)
    const offset = Number(req.query.offset || 0)

    const [rows, count] = await mediaService.listAndCountMedia({}, { take: limit, skip: offset })

    // Return DB fields as-is (admin UI expects url, thumbnail_url etc)
    const media = (rows || []).map((m: any) => ({
      id: m.id,
      url: m.url,
      mime_type: m.mime_type || null,
      title: m.title || null,
      alt_text: m.alt_text || null,
      thumbnail_url: m.thumbnail_url || null,
      metadata: m.metadata || null,
    }))

    res.json({ media, count: count || 0 })
  } catch (e: any) {
    console.error('Admin media GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list media' })
  }
}

/**
 * POST /admin/media
 * Body: { url, title?, mime_type?, thumbnail_url? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const body = (req.body || {}) as any

    const payload: any = {
      url: body.url,
      title: body.title,
      mime_type: body.mime_type,
      alt_text: body.alt_text,
      thumbnail_url: body.thumbnail_url,
      metadata: body.metadata,
    }

    const created = await (typeof mediaService.createMedia === 'function'
      ? mediaService.createMedia(payload)
      : mediaService.createMedias(payload))

    const result = Array.isArray(created) ? created[0] : created
    res.status(201).json({ media: result })
  } catch (e: any) {
    console.error('Admin media POST error:', e)
    res.status(500).json({ message: e?.message || 'Failed to create media' })
  }
}

