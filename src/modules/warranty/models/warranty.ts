import { model } from "@medusajs/framework/utils"

// Basic warranty info recorded per customer/product/order
const Warranty = model.define("warranty", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  order_id: model.text().nullable(),
  order_item_id: model.text().nullable(),
  customer_email: model.text(),
  type: model.text().default("manufacturer"), // manufacturer | seller | extended
  duration_months: model.number().default(12),
  start_date: model.dateTime(),
  end_date: model.dateTime().nullable(),
  status: model.text().default("active"), // active | expired | void
  terms: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default Warranty
