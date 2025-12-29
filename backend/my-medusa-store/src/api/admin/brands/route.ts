import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brands"
import BrandService from "../../../modules/brands/service"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const [brands, count] = await brandService.listAndCountBrands(
      {},
      {
        skip: offset,
        take: limit,
        order: { display_order: "ASC", name: "ASC" },
      }
    )

    res.json({ brands, count, limit, offset })
  } catch (e: any) {
    console.error('Admin brand list error:', e)
    res.status(500).json({ message: e?.message || 'Failed to list brands' })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const brandService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const body = (req.body || {}) as any
    if (!body?.name) return res.status(400).json({ message: 'name is required' })

    // Ensure slug is present — MikroORM schema requires it. Generate from name when missing.
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

    const [created] = await brandService.createBrands([{
      name: body.name,
      slug,
      description: body.description ?? null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      is_active: body.is_active ?? true,
      display_order: body.display_order ?? 0,
    }])

    res.json({ brand: created })
  } catch (e: any) {
    console.error('Admin brand create error:', e)
    res.status(500).json({ message: e?.message || 'Failed to create brand' })
  }
}
