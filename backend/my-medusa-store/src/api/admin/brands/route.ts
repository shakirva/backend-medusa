import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Knex } from "knex"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pgConnection: Knex = req.scope.resolve("__pg_connection__")
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total FROM brand WHERE deleted_at IS NULL`
    )
    const count = parseInt(countResult.rows[0].total)

    const result = await pgConnection.raw(
      `SELECT id, name, slug, description, logo_url, banner_url,
              is_active, is_special, display_order, created_at
       FROM brand
       WHERE deleted_at IS NULL
       ORDER BY display_order ASC NULLS LAST, name ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    res.json({ brands: result.rows, count, limit, offset })
  } catch (e: any) {
    console.error('Admin brand list error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list brands' })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pgConnection: Knex = req.scope.resolve("__pg_connection__")
    // Safety: if body arrives as a JSON string (double-stringified by caller), parse it
    let rawBody = req.body || {}
    if (typeof rawBody === "string") {
      try { rawBody = JSON.parse(rawBody) } catch { /* leave as-is */ }
    }
    const body = rawBody as any
    if (!body?.name) return res.status(400).json({ message: 'name is required' })

    // Generate slug from name when missing
    const makeSlug = (v: string) =>
      v
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

    const slug = body.slug && body.slug !== '' ? body.slug : makeSlug(body.name)
    const logoUrl = body.logo ?? body.logo_url ?? null
    const bannerUrl = body.banner ?? body.banner_url ?? null

    // Generate a unique id
    const idPrefix = "brand_"
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let randomPart = ""
    for (let i = 0; i < 20; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const newId = `${idPrefix}${randomPart}`

    const result = await pgConnection.raw(
      `INSERT INTO brand (id, name, slug, description, logo_url, banner_url, is_active, is_special, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       RETURNING *`,
      [
        newId,
        body.name,
        slug,
        body.description ?? null,
        logoUrl,
        bannerUrl,
        body.is_active ?? true,
        body.is_special ?? false,
        body.display_order ?? 0,
      ]
    )

    res.json({ brand: result.rows[0] })
  } catch (e: any) {
    console.error('Admin brand create error:', e)
    res.status(500).json({ message: e?.message || 'Failed to create brand' })
  }
}
