/**
 * Odoo Products Store API
 * Public endpoint for fetching products from Odoo for storefront
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OdooSyncService, { OdooProduct } from "../../../../modules/odoo-sync/service"

const odooService = new OdooSyncService()

interface StorefrontProduct {
  id: string
  title: string
  handle: string
  description: string | null
  price: number
  currency: string
  sku: string
  barcode: string | null
  weight: number
  stock: number
  in_stock: boolean
  category: { id: number; name: string } | null
  thumbnail: string | null
  metadata: Record<string, any>
}

/**
 * GET /store/odoo/products
 * Fetch products from Odoo for public display
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    const category = req.query.category as string

    if (!odooService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: "Product sync service is not available",
      })
      return
    }

    const products = await odooService.fetchProducts(limit, offset)

    // Convert to storefront-friendly format
    const storefrontProducts: StorefrontProduct[] = products.map((p: OdooProduct) => {
      const medusaFormat = odooService.convertToMedusaProduct(p)
      
      return {
        id: `odoo-${p.id}`,
        title: p.name,
        handle: medusaFormat.handle,
        description: (p.description_sale as string) || (p.description as string) || null,
        price: p.list_price,
        currency: "AED",
        sku: (p.default_code as string) || `ODOO-${p.id}`,
        barcode: (p.barcode as string) || null,
        weight: p.weight,
        stock: Math.floor(p.qty_available || 0),
        in_stock: (p.qty_available || 0) > 0,
        category: p.categ_id ? {
          id: p.categ_id[0],
          name: p.categ_id[1],
        } : null,
        thumbnail: p.image_1920 ? `data:image/png;base64,${p.image_1920}` : null,
        metadata: {
          odoo_id: p.id,
          cost_price: p.standard_price,
          type: p.type,
        },
      }
    })

    // Filter by category if specified
    let filteredProducts = storefrontProducts
    if (category) {
      filteredProducts = storefrontProducts.filter(
        (p: StorefrontProduct) => p.category?.name?.toLowerCase().includes(category.toLowerCase())
      )
    }

    res.json({
      success: true,
      products: filteredProducts,
      count: filteredProducts.length,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Error fetching Odoo products:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    })
  }
}
