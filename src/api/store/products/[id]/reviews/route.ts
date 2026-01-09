import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../../modules/reviews"
import ReviewService from "../../../../../modules/reviews/service"

// Public: list approved reviews for a product
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve<ReviewService>(REVIEW_MODULE)
  const product_id = req.params.id
  const reviews = await reviewService.listApprovedByProduct(product_id)
  res.json({ reviews })
}

// Auth required: create a review for a product
export const AUTHENTICATE = true

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve<ReviewService>(REVIEW_MODULE)
  const product_id = req.params.id
  const customer_id = (req as any).auth_customer_id || (req as any).customer_id
  if (!customer_id) {
    return res.status(401).json({ message: "Unauthenticated" })
  }
  const { rating, title, content } = req.body as any
  if (rating == null) {
    return res.status(400).json({ message: "rating required" })
  }
  const review = await reviewService.addReview(customer_id, product_id, Number(rating), title, content)
  res.json({ review })
}
