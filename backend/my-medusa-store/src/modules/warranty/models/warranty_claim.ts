import { model } from "@medusajs/framework/utils"

const WarrantyClaim = model.define("warranty_claim", {
  id: model.id().primaryKey(),
  warranty_id: model.text(),
  customer_email: model.text(),
  issue_description: model.text(),
  status: model.text().default("submitted"), // submitted | in_review | approved | rejected | completed
  admin_notes: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default WarrantyClaim
