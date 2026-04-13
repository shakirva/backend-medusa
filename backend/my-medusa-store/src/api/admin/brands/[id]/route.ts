import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Knex } from "knex"

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
    const pgConnection: Knex = req.scope.resolve("__pg_connection__")
    const result = await pgConnection.raw(
      `SELECT id, name, slug, description, logo_url, banner_url,
              is_active, is_special, display_order, created_at
       FROM brand WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Brand not found' })
    res.json({ brand: result.rows[0] })
  } catch (e: any) {
    console.error('Admin brand GET error:', e)
    res.status(500).json({ message: e?.message || 'Failed to retrieve brand' })
  }
}

/**
 * PUT /admin/brands/:id
 * Update a brand — uses raw SQL for reliability
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const pgConnection: Knex = req.scope.resolve("__pg_connection__")

    // Safety: if body arrives as a JSON string (double-stringified by caller), parse it
    let rawBody = req.body || {}
    if (typeof rawBody === "string") {
      try { rawBody = JSON.parse(rawBody) } catch { /* leave as-is */ }
    }
    const body = rawBody as any
    console.log('[Brand PUT] id:', req.params.id, 'body:', JSON.stringify(body))

    // Check brand exists
    const existing = await pgConnection.raw(
      `SELECT id FROM brand WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    )
    if (!existing.rows.length) return res.status(404).json({ message: 'Brand not found' })

    // Build dynamic SET clause — only update fields that were provided
    const allowedFields = ['name', 'description', 'logo_url', 'banner_url', 'is_active', 'is_special', 'display_order']
    const setClauses: string[] = []
    const values: any[] = []

    // Normalize: accept `logo` as `logo_url`
    if (body.logo && !body.logo_url) body.logo_url = body.logo
    if (body.banner && !body.banner_url) body.banner_url = body.banner

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`)
        values.push(body[field])
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' })
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`)

    values.push(req.params.id) // for WHERE clause
    const sql = `UPDATE brand SET ${setClauses.join(', ')} WHERE id = ? AND deleted_at IS NULL RETURNING *`
    console.log('[Brand PUT] SQL:', sql, 'values:', values)

    const result = await pgConnection.raw(sql, values)
    const brand = result.rows[0]
    console.log('[Brand PUT] updated:', brand?.name, 'is_special:', brand?.is_special, 'is_active:', brand?.is_active)

    res.json({ brand })
  } catch (e: any) {
    console.error('Admin brand PUT error:', e)
    res.status(500).json({ message: e?.message || 'Failed to update brand' })
  }
}

/**
 * DELETE /admin/brands/:id
 * Soft-delete a brand
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const pgConnection: Knex = req.scope.resolve("__pg_connection__")
    const id = req.params.id
    if (!id) return res.status(400).json({ message: 'id is required' })

    const existing = await pgConnection.raw(
      `SELECT id FROM brand WHERE id = ? AND deleted_at IS NULL`, [id]
    )
    if (!existing.rows.length) return res.status(404).json({ message: 'Brand not found' })

    // Soft delete
    await pgConnection.raw(
      `UPDATE brand SET deleted_at = NOW() WHERE id = ?`, [id]
    )
    // Also remove product-brand links
    await pgConnection.raw(
      `DELETE FROM product_brand WHERE brand_id = ?`, [id]
    ).catch(() => { /* table might not exist */ })

    res.status(204).send()
  } catch (e: any) {
    console.error('Admin brand DELETE error:', e)
    res.status(500).json({ message: e?.message || 'Failed to delete brand' })
  }
}
