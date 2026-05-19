import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/products
 *
 * Returns products from the store, with optional filtering and search.
 *
 * Query params:
 *   ?q=search_term       (search by title or description)
 *   ?limit=20            (default 20, max 100)
 *   ?offset=0            (default 0)
 *   ?handle=product-slug (filter by handle)
 *   ?collection_handle   (filter by collection)
 *   ?tags=tag1,tag2      (filter by tags)
 *   ?region_id=reg_xxx   (specific region for pricing)
 *   ?currency=kwd        (currency for price lookup, default kwd)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0
    const searchQuery = req.query.q as string
    const handle = req.query.handle as string
    const collectionHandle = req.query.collection_handle as string
    const tags = req.query.tags as string
    const currency = (req.query.currency as string) || "kwd"

    // Build WHERE conditions
    const conditions: string[] = ["p.status = 'published'"]
    const params: any[] = []

    // Search by title or description
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery}%`
      conditions.push("(LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))")
      params.push(searchTerm, searchTerm)
    }

    // Filter by handle
    if (handle) {
      conditions.push("p.handle = ?")
      params.push(handle)
    }

    // Filter by collection
    if (collectionHandle) {
      conditions.push(
        `p.id IN (
          SELECT p.id FROM product p
          INNER JOIN product_collection pc ON p.collection_id = pc.id
          WHERE pc.handle = ?
        )`
      )
      params.push(collectionHandle)
    }

    // Filter by tags
    if (tags && tags.trim()) {
      const tagList = tags.split(",").map(t => t.trim()).filter(t => t)
      if (tagList.length > 0) {
        const placeholders = tagList.map(() => "?").join(",")
        conditions.push(
          `p.id IN (
            SELECT DISTINCT pt.product_id FROM product_tag pt
            WHERE pt.tag_id IN (
              SELECT id FROM product_tag WHERE name IN (${placeholders})
            )
          )`
        )
        params.push(...tagList)
      }
    }

    // Count total matching products
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM product p
      WHERE ${conditions.join(" AND ")}
    `
    const countResult = await pgConnection.raw(countQuery, params)
    const total = parseInt(countResult.rows?.[0]?.total || "0")

    // Fetch products with their variants and prices
    const productsQuery = `
      SELECT DISTINCT ON (p.id)
        p.id,
        p.title,
        p.handle,
        p.thumbnail,
        p.subtitle,
        p.description,
        p.metadata,
        p.created_at,
        pv.id as variant_id,
        pv.sku,
        pp.amount as price,
        pp.currency_code
      FROM product p
      LEFT JOIN product_variant pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
      LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
      LEFT JOIN price pp ON pp.price_set_id = pvps.price_set_id AND pp.currency_code = ?
      WHERE ${conditions.join(" AND ")}
      ORDER BY p.id, p.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const productsResult = await pgConnection.raw(
      productsQuery,
      [currency.toUpperCase(), ...params, limit, offset]
    )
    const products = productsResult.rows || []

    // Fetch all images for these products
    const productIds = products.map((p: any) => p.id)
    let imagesByProduct: Record<string, any[]> = {}
    
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(",")
      const imagesResult = await pgConnection.raw(
        `SELECT id, product_id, url FROM product_image WHERE product_id IN (${placeholders}) ORDER BY product_id, position`,
        productIds
      )
      const images = imagesResult.rows || []
      images.forEach((img: any) => {
        if (!imagesByProduct[img.product_id]) {
          imagesByProduct[img.product_id] = []
        }
        imagesByProduct[img.product_id].push({
          id: img.id,
          url: img.url,
        })
      })
    }

    // Format response
    const formattedProducts = products.map((p: any) => {
      const meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : (p.metadata || {})
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail,
        subtitle: p.subtitle,
        description: p.description,
        price: p.price ? parseFloat(p.price) : null,
        currency_code: p.currency_code,
        sku: p.sku,
        images: imagesByProduct[p.id] || [],
        metadata: meta,
        created_at: p.created_at,
      }
    })

    res.json({
      products: formattedProducts,
      count: total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[GET /store/products] Error:", error)
    res.status(500).json({
      type: "server_error",
      message: error.message,
    })
  }
}
