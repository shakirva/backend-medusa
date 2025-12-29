import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brands"
import BrandService from "../../../../modules/brands/service"

// Admin endpoints should require authentication
export const AUTHENTICATE = true

/**
 * GET /admin/brands/:id
 * Get a single brand by ID
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const brand = await brandModuleService.retrieveBrand(req.params.id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })
    res.json({ brand })
  } catch (e: any) {
    console.error('Admin brand GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to retrieve brand' })
  }
}

/**
 * PUT /admin/brands/:id
 * Update a brand
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const body = (req.body || {}) as any
    // Normalize fields: accept `logo` (from admin UI) as `logo_url` expected by the service
    const updates: any = { ...body }
    if (body.logo && !body.logo_url) updates.logo_url = body.logo
    if (body.banner && !body.banner_url) updates.banner_url = body.banner

    const brand = await brandModuleService.updateBrands({ id: req.params.id }, updates)
    res.json({ brand })
  } catch (e: any) {
    console.error('Admin brand PUT error:', e)
    res.status(500).json({ message: e?.message || 'Failed to update brand' })
  }
}

/**
 * DELETE /admin/brands/:id
 * Delete (soft or hard depending on service) a brand
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const brandModuleService = req.scope.resolve<BrandService>(BRAND_MODULE)
    const id = req.params.id
    if (!id) return res.status(400).json({ message: 'id is required' })

    const existing = await brandModuleService.retrieveBrand(id).catch(() => null)
    if (!existing) return res.status(404).json({ message: 'Brand not found' })

    // Prefer soft delete if available, otherwise fallback to deleteBrands
    if (typeof brandModuleService.softDeleteBrands === 'function') {
      await brandModuleService.softDeleteBrands([id])
    } else if (typeof brandModuleService.deleteBrands === 'function') {
      await brandModuleService.deleteBrands({ id })
    } else {
      // As a last resort, call a generic delete method if present
      const maybeAny = brandModuleService as unknown as { delete?: (id: string) => Promise<void> }
      if (typeof maybeAny.delete === 'function') {
        await maybeAny.delete(id)
      }
    }

    // Return 204 No Content for consistency with other admin deletes
    res.status(204).send()
  } catch (e: any) {
    console.error('Admin brand DELETE error:', e)
    res.status(500).json({ message: e?.message || 'Failed to delete brand' })
  }
}
