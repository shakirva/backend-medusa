import { model } from "@medusajs/framework/utils";

/**
 * Join table between gallery and media with ordering
 */
const GalleryMedia = model.define("gallery_media", {
  id: model.id().primaryKey(),
  gallery_id: model.text(),
  media_id: model.text(),
  display_order: model.number().default(0),
  metadata: model.json().nullable(),
});

export default GalleryMedia;
