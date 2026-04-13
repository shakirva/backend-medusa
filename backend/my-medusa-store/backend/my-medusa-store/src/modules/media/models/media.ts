import { model } from "@medusajs/framework/utils";

/**
 * Media entity for storing uploaded asset references
 * Supports images, videos, and other media types
 */
const Media = model.define("media", {
  id: model.id().primaryKey(),
  url: model.text(),
  mime_type: model.text().nullable(),
  title: model.text().nullable(),
  title_ar: model.text().nullable(), // Arabic title for RTL support
  alt_text: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
  brand: model.text().nullable(), // Brand name for display
  views: model.number().default(0), // View count for analytics
  display_order: model.number().default(0), // Order in gallery
  is_featured: model.boolean().default(false), // Featured videos
  metadata: model.json().nullable(),
});

export default Media;
