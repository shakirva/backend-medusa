import { model } from "@medusajs/framework/utils"

/**
 * Brand entity representing product brands/manufacturers
 * Supports SEO, ordering, and active/inactive status
 */
const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  banner_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  display_order: model.number().default(0),
})

export default Brand