import { model } from "@medusajs/framework/utils"

/**
 * Customer Review for a product
 */
const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  rating: model.number(), // 1-5
  title: model.text().nullable(),
  content: model.text().nullable(),
  status: model.text().default("pending"), // pending | approved | rejected
})

export default Review
