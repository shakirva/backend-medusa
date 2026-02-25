import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import WishlistService from "../../../modules/wishlist/service"
import { Modules } from "@medusajs/framework/utils"

// Enable auth now. Remove dev fallbacks.
export const AUTHENTICATE = true

// GET /store/wishlist  -> requires authenticated customer
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService
  // MedusaJS 2.x uses auth_context.actor_id for authenticated customer
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }
  const items = await wishlistService.listItemsForCustomer(customer_id)
  let products: any[] = []
  if (items.length) {
    const productIds = items.map((i: any) => i.product_id)
    const productService = req.scope.resolve(Modules.PRODUCT)
    products = await productService.listProducts({ id: productIds })
  }
  res.json({ customer_id, items, products })
}
