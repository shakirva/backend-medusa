import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

function toNumberOrNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function listCategories(productService: any) {
  const candidates = ["listProductCategories", "listCategories", "list"]
  for (const method of candidates) {
    if (typeof productService?.[method] === "function") {
      const result = await productService[method]({}, { take: 300 })
      if (Array.isArray(result)) return result
      if (Array.isArray(result?.product_categories)) return result.product_categories
      if (Array.isArray(result?.categories)) return result.categories
    }
  }
  return []
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const productService = req.scope.resolve(Modules.PRODUCT) as any
    const categories = await listCategories(productService)

    const homeCategories = (categories || []).map((c: any) => {
      const md = c?.metadata || {}
      return {
        id: c.id,
        name: c.name,
        handle: c.handle,
        metadata: md,
        home_enabled: md.home_enabled !== false,
        home_order: toNumberOrNull(md.home_order),
        discount: toNumberOrNull(md.discount),
      }
    })

    homeCategories.sort((a: any, b: any) => {
      const ao = a.home_order == null ? Number.MAX_SAFE_INTEGER : a.home_order
      const bo = b.home_order == null ? Number.MAX_SAFE_INTEGER : b.home_order
      return ao - bo
    })

    res.json({ categories: homeCategories, count: homeCategories.length })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to list home categories" })
  }
}

