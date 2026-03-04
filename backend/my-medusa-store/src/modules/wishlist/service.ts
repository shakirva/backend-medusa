import { MedusaService } from "@medusajs/framework/utils"
import Wishlist from "./models/wishlist"
import WishlistItem from "./models/wishlist-item"

class WishlistService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {
  async getOrCreateWishlist(customer_id: string) {
    const [existing] = await this.listWishlists({ customer_id })
    if (existing) return existing
    return this.createWishlists({ customer_id })
  }

  async listItemsForCustomer(customer_id: string) {
    const [existing] = await this.listWishlists({ customer_id })
    if (!existing) return []
    return this.listWishlistItems({ wishlist_id: existing.id })
  }

  async addItem(customer_id: string, product_id: string, variant_id?: string) {
    const wishlist = await this.getOrCreateWishlist(customer_id)
    const existingItems = await this.listWishlistItems({ wishlist_id: wishlist.id, product_id, variant_id })
    if (existingItems.length) return existingItems[0]
    return this.createWishlistItems({ wishlist_id: wishlist.id, product_id, variant_id })
  }

  async removeItem(item_id: string) {
    await this.deleteWishlistItems(item_id)
    return { id: item_id, deleted: true }
  }
}

export default WishlistService
