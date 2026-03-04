import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/reviews"
import ReviewService from "../../../modules/reviews/service"

export const AUTHENTICATE = true

// GET /admin/reviews?status=pending&product_id=...
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve<ReviewService>(REVIEW_MODULE)
  const { status, product_id, limit = "50", offset = "0" } = req.query as any
  const filter: any = {}
  if (status) filter.status = status
  if (product_id) filter.product_id = product_id

  const [reviews, count] = await reviewService.listReviewsWithFilter(filter, {
    take: Number(limit),
    skip: Number(offset),
    order: { created_at: "DESC" },
  })
  res.json({ reviews, count, limit: Number(limit), offset: Number(offset) })
}
