import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Knex } from "knex"

export const AUTHENTICATE = false

/**
 * GET /store/brands
 * List active brands for storefront using raw SQL so all brands are returned.
 * Pass ?special=true to return only brands marked as special (for the explore section).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection: Knex = req.scope.resolve("__pg_connection__")

  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0
  const specialOnly = req.query.special === "true"

  const conditions: string[] = ["b.is_active = true", "b.deleted_at IS NULL"]
  if (specialOnly) {
    conditions.push("b.is_special = true")
  }

  const whereClause = conditions.join(" AND ")

  // Count total
  const countResult = await pgConnection.raw(
    `SELECT COUNT(*) as total FROM brand b WHERE ${whereClause}`
  )
  const total = parseInt(countResult.rows[0].total)

  // Fetch brands ordered by display_order then name
  const result = await pgConnection.raw(
    `SELECT b.id, b.name, b.slug, b.description, b.logo_url, b.banner_url,
            b.is_active, b.is_special, b.display_order, b.created_at,
            COUNT(DISTINCT pb.product_id) as product_count
     FROM brand b
     LEFT JOIN product_brand pb ON pb.brand_id = b.id
     WHERE ${whereClause}
     GROUP BY b.id
     ORDER BY b.display_order ASC NULLS LAST, b.name ASC
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
    product_count: parseInt(b.product_count) || 0,
    created_at: b.created_at,
  }))

  res.json({ brands, count: total, limit, offset })
}

