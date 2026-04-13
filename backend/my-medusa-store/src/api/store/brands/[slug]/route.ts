import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brands"
import BrandService from "../../../../modules/brands/service"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/brands/:slug
 * Get a single active brand by slug with products + KWD prices
 * Always uses KWD — Kuwait-only store
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const [items] = await brandModuleService.listAndCountBrands({
    slug: req.params.slug,
    is_active: true,
  }, { take: 1 })

  if (!items || items.length === 0) {
    return res.status(404).json({ message: "Brand not found" })
  }

  const brand = items[0]
  const productIds = await brandModuleService.listBrandProducts(brand.id)

  if (!productIds.length) {
    return res.json({ brand, products: [] })
  }

  // Fetch products WITH KWD prices in one SQL query
  const placeholders = productIds.map(() => "?").join(",")
  const result = await pgConnection.raw(
    `SELECT DISTINCT ON (p.id)
       p.id, p.title, p.handle, p.thumbnail, p.subtitle,
       p.description, p.metadata, p.created_at,
       pv.id        AS variant_id,
       pv.sku,
       pv.inventory_quantity,
       pp.amount    AS price_amount,
       pp.currency_code
     FROM product p
     LEFT JOIN product_variant pv
       ON pv.product_id = p.id AND pv.deleted_at IS NULL
     LEFT JOIN product_variant_price_set pvps
       ON pvps.variant_id = pv.id
     LEFT JOIN price pp
       ON pp.price_set_id = pvps.price_set_id AND pp.currency_code = 'kwd'
     WHERE p.id IN (${placeholders})
       AND p.deleted_at IS NULL
       AND p.status = 'published'
     ORDER BY p.id, pp.amount ASC NULLS LAST`,
    productIds
  )

  // Shape products to match what the brand page's transformProduct() expects
  const products = result.rows.map((row: any) => {
    const meta = typeof row.metadata === "string"
      ? JSON.parse(row.metadata)
      : (row.metadata || {})

    return {
      id: row.id,
      title: row.title,
      handle: row.handle,
      thumbnail: row.thumbnail,
      subtitle: row.subtitle,
      description: row.description,
      metadata: meta,
      created_at: row.created_at,
      // Provide variants array so transformProduct() can read prices
      variants: [{
        id: row.variant_id,
        sku: row.sku,
        inventory_quantity: row.inventory_quantity ?? 1,
        prices: row.price_amount != null
          ? [{ amount: parseFloat(row.price_amount), currency_code: "kwd" }]
          : [],
        calculated_price: row.price_amount != null
          ? { calculated_amount: parseFloat(row.price_amount), currency_code: "kwd" }
          : null,
      }],
    }
  })

  res.json({ brand, products })
}
