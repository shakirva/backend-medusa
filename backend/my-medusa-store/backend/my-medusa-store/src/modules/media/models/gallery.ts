import { model } from "@medusajs/framework/utils";

/**
 * Gallery - groups of media items (e.g., promotions, category banners)
 */
const Gallery = model.define("gallery", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
  display_order: model.number().default(0),
  metadata: model.json().nullable(),
});

export default Gallery;
