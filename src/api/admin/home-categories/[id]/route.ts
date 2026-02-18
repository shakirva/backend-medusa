import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

async function updateCategory(productService: any, id: string, data: Record<string, any>) {
  const candidates = ["updateProductCategories", "updateProductCategory", "updateCategories", "update"]
  for (const method of candidates) {
    if (typeof productService?.[method] === "function") {
      if (method.endsWith("s")) {
        return await productService[method]([{ id, ...data }])
      }
      return await productService[method](id, data)
    }
  }
  throw new Error("No category update method found on product service")
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ message: "Category id is required" })

    const body = (req.body || {}) as any
    const productService = req.scope.resolve(Modules.PRODUCT) as any

    let existing: any = null
    try {
      if (typeof productService.retrieveProductCategory === "function") {
        existing = await productService.retrieveProductCategory(id)
      } else if (typeof productService.retrieveCategory === "function") {
        existing = await productService.retrieveCategory(id)
      }
    } catch {
      existing = null
    }

    const metadata = {
      ...(existing?.metadata || {}),
      ...(body.metadata || {}),
    }

    if (typeof body.home_enabled === "boolean") {
      metadata.home_enabled = body.home_enabled
    }
    if (body.home_order !== undefined && body.home_order !== null && body.home_order !== "") {
      metadata.home_order = Number(body.home_order)
    }
    if (body.discount !== undefined && body.discount !== null && body.discount !== "") {
      metadata.discount = Number(body.discount)
    }

    const payload: Record<string, any> = { metadata }

    const updated = await updateCategory(productService, id, payload)
    res.json({ category: updated })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to update home category" })
  }
}

