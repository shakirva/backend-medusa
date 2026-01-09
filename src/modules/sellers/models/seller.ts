import { model } from "@medusajs/framework/utils";

const Seller = model.define("seller", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  legal_name: model.text().nullable(),
  tax_id: model.text().nullable(),
  address_json: model.json().nullable(),
  logo_url: model.text().nullable(),
  status: model.text().default("pending"), // pending | approved | rejected | suspended
  metadata: model.json().nullable(),
});

export default Seller;
