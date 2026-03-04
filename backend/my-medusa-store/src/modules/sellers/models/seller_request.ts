import { model } from "@medusajs/framework/utils";

const SellerRequest = model.define("seller_request", {
  id: model.id().primaryKey(),
  seller_name: model.text(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  documents_urls: model.json().nullable(), // array of strings
  notes: model.text().nullable(),
  status: model.text().default("pending"), // pending | approved | rejected
  decision_note: model.text().nullable(),
  decided_at: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default SellerRequest;
