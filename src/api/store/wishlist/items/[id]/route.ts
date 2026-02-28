import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"
import WishlistService from "../../../../../modules/wishlist/service"

export const AUTHENTICATE = true

// DELETE /store/wishlist/items/:id requires authenticated customer
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService
  // MedusaJS 2.x uses auth_context.actor_id for authenticated customer
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ message: "item id required" })
  }
  // (Optional) Could validate the item belongs to this customer before delete.
  const result = await wishlistService.removeItem(id)
  res.json(result)
}
