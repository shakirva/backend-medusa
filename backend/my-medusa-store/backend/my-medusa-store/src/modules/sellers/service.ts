import { MedusaService } from "@medusajs/framework/utils"
import Seller from "./models/seller"
import SellerRequest from "./models/seller_request"
import SellerProductLink from "./models/seller_product_link"

class SellerService extends MedusaService({ Seller, SellerRequest, SellerProductLink }) {
  async addProductToSeller(seller_id: string, product_id: string, display_order = 0) {
    const existing = await this.listSellerProductLinks({ seller_id, product_id })
    if (existing.length) return existing[0]
    return this.createSellerProductLinks({ seller_id, product_id, display_order })
  }

  async removeProductFromSeller(seller_id: string, product_id: string) {
    const [links] = await this.listAndCountSellerProductLinks({ seller_id, product_id }, { take: 1 })
    if (links?.length) {
      await this.deleteSellerProductLinks({ id: links[0].id })
    }
  }
}

export default SellerService
