import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../modules/wishlist"
import WishlistService from "../../../../modules/wishlist/service"

export const AUTHENTICATE = true

// POST /store/wishlist/items  Body: { product_id, variant_id? } requires authenticated customer
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService
  const body = req.body as { product_id?: string; variant_id?: string }
  const customer_id = (req as any).auth_customer_id || (req as any).customer_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }
  if (!body.product_id) {
    return res.status(400).json({ message: "product_id required" })
  }
  const item = await wishlistService.addItem(customer_id, body.product_id, body.variant_id)
  res.json({ item })
}

// DELETE moved to items/[id]/route.ts for proper dynamic param routing.
