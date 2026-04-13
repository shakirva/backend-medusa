import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../modules/wishlist"
import WishlistService from "../../../../modules/wishlist/service"

export const AUTHENTICATE = true

/**
 * GET /store/wishlist/check?product_id={product_id}
 *
 * Efficiently checks if a single product is in the authenticated customer's wishlist.
 * Returns O(1) result — does NOT fetch the entire wishlist.
 * Use this on Product Detail pages to show/hide the heart icon.
 *
 * Headers:
 *   Authorization: Bearer {customer_token}
 *
 * Query params:
 *   product_id  - required  (e.g. prod_01ABC123)
 *
 * Response 200:
 * {
 *   "is_wishlisted": true,
 *   "item_id": "witem_01ABC123"   // null if not wishlisted
 * }
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }

  const { product_id } = req.query as { product_id?: string }
  if (!product_id) {
    return res.status(400).json({ message: "product_id query param is required" })
  }

  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService

  // Resolve the customer's wishlist (no create — read-only)
  const [wishlist] = await wishlistService.listWishlists({ customer_id })
  if (!wishlist) {
    return res.json({ is_wishlisted: false, item_id: null })
  }

  // Query ONLY for this specific product — no full list scan
  const [item] = await wishlistService.listWishlistItems({
    wishlist_id: wishlist.id,
    product_id,
  })

  return res.json({
    is_wishlisted: !!item,
    item_id: item?.id ?? null,
  })
}
