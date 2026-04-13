import { model } from "@medusajs/framework/utils";

const SellerProductLink = model.define("seller_product_link", {
  id: model.id().primaryKey(),
  seller_id: model.text(),
  product_id: model.text(),
  display_order: model.number().default(0),
  metadata: model.json().nullable(),
});

export default SellerProductLink;
