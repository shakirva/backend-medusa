import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../../modules/reviews"
import ReviewService from "../../../../../modules/reviews/service"

export const AUTHENTICATE = true

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve<ReviewService>(REVIEW_MODULE)
  const { id } = req.params
  const review = await reviewService.approveReview(id)
  res.json({ review })
}
