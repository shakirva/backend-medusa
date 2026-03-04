import { MedusaService } from "@medusajs/framework/utils"
import Review from "./models/review"

class ReviewService extends MedusaService({ Review }) {
  async addReview(customer_id: string, product_id: string, rating: number, title?: string, content?: string) {
    const clamped = Math.max(1, Math.min(5, Number(rating)))
    return this.createReviews({ customer_id, product_id, rating: clamped, title, content })
  }

  async listApprovedByProduct(product_id: string) {
    return this.listReviews({ product_id, status: "approved" })
  }

  async listReviewsWithFilter(filter: any = {}, config: any = {}) {
    return this.listAndCountReviews(filter, config)
  }

  async approveReview(id: string) {
    return this.updateReviews({ id, status: "approved" })
  }

  async rejectReview(id: string) {
    return this.updateReviews({ id, status: "rejected" })
  }
}

export default ReviewService
