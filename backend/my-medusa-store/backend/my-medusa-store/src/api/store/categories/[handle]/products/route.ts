import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/categories/:handle/products
 * 
 * Returns products for a specific category by handle
 * Includes child category products too
 * 
 * Query params:
 * - page (default: 1)
 * - limit (default: 20)
 * - sort: price_asc, price_desc, newest, oldest, title_asc, title_desc (default: newest)
 * - min_price, max_price
 * - brand
 * - in_stock: true/false
 * - currency (default: aed)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const handle = req.params.handle
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
  const offset = (page - 1) * limit
  const sort = (req.query.sort as string) || "newest"
  const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : null
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : null
  const brand = req.query.brand as string
  const inStock = req.query.in_stock as string
  const currency = (req.query.currency as string) || "aed"

  try {
    // Find category by handle and get all child category IDs
    const categoryResult = await pgConnection.raw(
      `SELECT id, name, handle, metadata FROM product_category 
       WHERE handle = ? AND deleted_at IS NULL`,
      [handle]
    )

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      return res.status(404).json({ type: "not_found", message: "Category not found" })
    }

    const category = categoryResult.rows[0]
    const catMeta = typeof category.metadata === "string" 
      ? JSON.parse(category.metadata) 
      : (category.metadata || {})

    // Get this category + all child category IDs
    const childrenResult = await pgConnection.raw(
      `WITH RECURSIVE cat_tree AS (
         SELECT id FROM product_category WHERE id = ?
         UNION ALL
         SELECT pc.id FROM product_category pc
         JOIN cat_tree ct ON pc.parent_category_id = ct.id
         WHERE pc.deleted_at IS NULL
       )
       SELECT id FROM cat_tree`,
      [category.id]
    )
    const categoryIds = childrenResult.rows.map((r: any) => r.id)

    // Build WHERE conditions
    const conditions: string[] = [
      "p.status = 'published'",
      "p.deleted_at IS NULL",
      `pcp.product_category_id IN (${categoryIds.map(() => "?").join(",")})`,
    ]
    const params: any[] = [...categoryIds]

    if (minPrice !== null) {
      conditions.push("pp.amount >= ?")
      params.push(minPrice)
    }
    if (maxPrice !== null) {
      conditions.push("pp.amount <= ?")
      params.push(maxPrice)
    }
    if (brand) {
      conditions.push("LOWER(p.title) LIKE ?")
      params.push(`${brand.toLowerCase()}%`)
    }
    if (inStock === "true") {
      conditions.push("COALESCE((p.metadata->>'stock_qty')::numeric, 0) > 0")
    }

    // Sort mapping
    let orderBy = "p.created_at DESC"
    switch (sort) {
      case "price_asc": orderBy = "pp.amount ASC NULLS LAST"; break
      case "price_desc": orderBy = "pp.amount DESC NULLS LAST"; break
      case "newest": orderBy = "p.created_at DESC"; break
      case "oldest": orderBy = "p.created_at ASC"; break
      case "title_asc": orderBy = "p.title ASC"; break
      case "title_desc": orderBy = "p.title DESC"; break
    }

    // Count total
    const countResult = await pgConnection.raw(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM product p
       JOIN product_category_product pcp ON pcp.product_id = p.id
       LEFT JOIN product_variant pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
       LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
       LEFT JOIN price pp ON pp.price_set_id = pvps.price_set_id AND pp.currency_code = ?
       WHERE ${conditions.join(" AND ")}`,
      [currency, ...params]
    )
    const total = parseInt(countResult.rows[0].total)

    // Get products
    const productsResult = await pgConnection.raw(
      `SELECT DISTINCT ON (p.id) 
              p.id, p.title, p.handle, p.thumbnail, p.subtitle,
              p.description, p.metadata, p.created_at,
              pp.amount as price, pp.currency_code,
              pv.id as variant_id, pv.sku
       FROM product p
       JOIN product_category_product pcp ON pcp.product_id = p.id
       LEFT JOIN product_variant pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
       LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
       LEFT JOIN price pp ON pp.price_set_id = pvps.price_set_id AND pp.currency_code = ?
       WHERE ${conditions.join(" AND ")}
       ORDER BY p.id, ${orderBy}
       LIMIT ? OFFSET ?`,
      [currency, ...params, limit, offset]
    )

    // Format response
    const products = productsResult.rows.map((p: any) => {
      const meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : (p.metadata || {})
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail,
        subtitle: p.subtitle,
        price: p.price ? parseFloat(p.price) : null,
        currency_code: p.currency_code || currency,
        in_stock: (meta.stock_qty || 0) > 0,
        brand: extractBrand(p.title),
        created_at: p.created_at,
      }
    })

    res.json({
      category: {
        id: category.id,
        name: category.name,
        handle: category.handle,
        image_url: catMeta.image_url || null,
      },
      products,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: offset + limit < total,
      },
    })
  } catch (error: any) {
    console.error("[Category Products] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}

function extractBrand(title: string): string | null {
  if (!title) return null
  const brands = [
    "Porodo", "Powerology", "Baseus", "Anker", "Samsung", "Apple",
    "Xiaomi", "Huawei", "Lenovo", "Green Lion", "LePresso", "Remax",
    "Hoco", "Joyroom", "Ugreen", "Liberty Guard", "Devia", "Oraimo",
    "Marshall", "JBL", "Sony", "Bose", "Harman", "Kemei",
  ]
  for (const brand of brands) {
    if (title.toLowerCase().startsWith(brand.toLowerCase())) return brand
  }
  return title.split(" ")[0]
}
