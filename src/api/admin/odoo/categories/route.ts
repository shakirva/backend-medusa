/**
 * Odoo Categories Admin API
 * Endpoints for fetching categories from Odoo
 * 
 * Supports:
 *   ?type=public|internal  (default: internal)
 *   ?q=search_term         (search by name, includes sub-categories)
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService from "../../../../modules/odoo-sync/service"

const odooService = new OdooSyncService()

/**
 * GET /admin/odoo/categories
 * Fetch categories from Odoo with optional search and type filtering
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    if (!odooService.isConfigured()) {
      res.status(400).json({
        success: false,
        error: "Odoo is not configured. Please set environment variables.",
      })
      return
    }

    const query = (req.query.q as string || "").trim().toLowerCase()
    const type = (req.query.type as string || "internal").toLowerCase()

    if (type === "public") {
      // Fetch website public categories (product.public.category)
      // These are the ones that sync to the website
      const categories = await odooService.fetchPublicCategories()

      let filtered = categories
      if (query) {
        // Search across name AND parent name to include sub-categories
        filtered = categories.filter((c: any) => {
          const name = (c.name || "").toLowerCase()
          const parentName = Array.isArray(c.parent_id) ? (c.parent_id[1] || "").toLowerCase() : ""
          const parentPath = (c.parent_path || "").toLowerCase()
          return name.includes(query) || parentName.includes(query) || parentPath.includes(query)
        })
      }

      // Build a hierarchy-aware response
      const categoryMap = new Map<number, any>()
      for (const cat of filtered) {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          parent_id: Array.isArray(cat.parent_id) ? cat.parent_id[0] : null,
          parent_name: Array.isArray(cat.parent_id) ? cat.parent_id[1] : null,
          parent_path: cat.parent_path || null,
          sequence: cat.sequence,
          medusa_sync: (cat as any).medusa_sync ?? true,
          has_image: !!cat.image_1920,
          depth: (cat.parent_path || "").split("/").filter(Boolean).length,
        })
      }

      res.json({
        success: true,
        data: {
          categories: Array.from(categoryMap.values()),
          count: categoryMap.size,
          search_query: query || null,
        },
      })
    } else {
      // Fetch internal categories (product.category) — the original behavior
      const categories = await odooService.fetchCategories()

      let filtered = categories
      if (query) {
        // Search by name or complete_name (which includes parent hierarchy like "All / Electronics / Phones")
        filtered = categories.filter((c: any) => {
          const name = (c.name || "").toLowerCase()
          const completeName = (c.complete_name || "").toLowerCase()
          return name.includes(query) || completeName.includes(query)
        })
      }

      res.json({
        success: true,
        data: {
          categories: filtered,
          count: filtered.length,
          search_query: query || null,
        },
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
