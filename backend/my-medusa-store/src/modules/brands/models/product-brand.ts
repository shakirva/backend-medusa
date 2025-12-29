import { model } from "@medusajs/framework/utils"

// Join model between products and brands
const ProductBrand = model.define("product_brand", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  brand_id: model.text(),
})

export default ProductBrand
