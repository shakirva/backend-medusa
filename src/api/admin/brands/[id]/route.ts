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
    const brandId = req.params.id

    console.log(`PUT /admin/brands/${brandId} - incoming body:`, JSON.stringify(body))

    // Build clean update object — never overwrite `id`
    const updates: Record<string, any> = {}
    if (body.name !== undefined)        updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.slug !== undefined)        updates.slug = body.slug
    if (body.logo_url !== undefined)    updates.logo_url = body.logo_url
    if (body.logo !== undefined && !body.logo_url) updates.logo_url = body.logo
    if (body.banner_url !== undefined)  updates.banner_url = body.banner_url
    if (body.banner !== undefined && !body.banner_url) updates.banner_url = body.banner
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order)

    // Cast booleans explicitly (they can arrive as strings from some HTTP clients)
    if (body.is_active !== undefined)   updates.is_active  = body.is_active  === true || body.is_active  === 'true'
    if (body.is_special !== undefined)  updates.is_special = body.is_special === true || body.is_special === 'true'

    console.log(`PUT /admin/brands/${brandId} - parsed updates:`, JSON.stringify(updates))

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' })
    }

    // Use raw SQL update to bypass Medusa v2 DML bug dropping false booleans
    const pgConnection = req.scope.resolve("__pg_connection__")
    
    // First let Medusa update standard text fields
    const brand = await brandModuleService.updateBrands({ id: brandId }, updates)
    
    // Then manually force the boolean fields in the DB
    if (body.is_active !== undefined || body.is_special !== undefined) {
      const active = body.is_active !== undefined ? (body.is_active === true || body.is_active === 'true') : (brand as any).is_active
      const special = body.is_special !== undefined ? (body.is_special === true || body.is_special === 'true') : (brand as any).is_special
      
      await pgConnection.raw(
        `UPDATE brand SET is_active = ?, is_special = ?, updated_at = NOW() WHERE id = ?`,
        [active, special, brandId]
      )
    }

    // Refetch to get the latest correct state
    const finalBrand = await brandModuleService.retrieveBrand(brandId)
    
    res.json({ brand: [finalBrand] })
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
