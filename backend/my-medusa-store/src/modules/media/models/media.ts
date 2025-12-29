import { model } from "@medusajs/framework/utils";

/**
 * Media entity for storing uploaded asset references
 */
const Media = model.define("media", {
  id: model.id().primaryKey(),
  url: model.text(),
  mime_type: model.text().nullable(),
  title: model.text().nullable(),
  alt_text: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default Media;
