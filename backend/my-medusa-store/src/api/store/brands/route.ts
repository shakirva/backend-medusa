import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Knex } from "knex"

export const AUTHENTICATE = false

/**
 * GET /store/brands
 * Returns active brands synced from Odoo.
 * Logo URLs point to files in the frontend's /public/brands/ folder.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection: Knex = req.scope.resolve("__pg_connection__")

  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0

  const countResult = await pgConnection.raw(
    `SELECT COUNT(*) as total FROM brand WHERE is_active = true AND deleted_at IS NULL`
  )
  const total = parseInt(countResult.rows[0].total)

  const result = await pgConnection.raw(
    `SELECT id, name, slug, description, logo_url, banner_url,
            is_active, is_special, display_order, created_at
     FROM brand
     WHERE is_active = true AND deleted_at IS NULL
     ORDER BY display_order ASC NULLS LAST, name ASC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )

  const brands = result.rows.map((b: any) => ({
    id: b.id,
    name: b.name,
    slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: b.description || "",
    logo_url: b.logo_url || "",
    banner_url: b.banner_url || "",
    is_active: b.is_active,
    is_special: b.is_special,
    display_order: b.display_order || 99,
    created_at: b.created_at,
  }))

  res.json({ brands, count: total, limit, offset })
}

