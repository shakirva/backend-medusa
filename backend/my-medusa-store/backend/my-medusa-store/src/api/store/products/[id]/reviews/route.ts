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

// Public: create a review (no auth required)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve<ReviewService>(REVIEW_MODULE)
  const product_id = req.params.id
  const { rating, title, content, customer_id, customer_name } = req.body as any
  if (rating == null) {
    return res.status(400).json({ message: "rating required" })
  }
  const review = await reviewService.addReview(
    customer_id || null,
    product_id,
    Number(rating),
    title || customer_name || "Anonymous",
    content
  )
  res.json({ success: true, review })
}
