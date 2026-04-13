import { model } from "@medusajs/framework/utils";

/**
 * Banner configuration - simplified with direct image URL
 */
const Banner = model.define("banner", {
  id: model.id().primaryKey(),
  title: model.text().nullable(),
  image_url: model.text().nullable(), // Direct image URL
  link: model.text().nullable(),
  position: model.text().nullable(),
  is_active: model.boolean().default(true),
  // ISO 8601 datetime strings (nullable)
  start_at: model.text().nullable(),
  end_at: model.text().nullable(),
  display_order: model.number().default(0),
  metadata: model.json().nullable(),
});

export default Banner;
