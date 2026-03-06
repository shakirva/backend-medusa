/**
 * Diagnostic Script — Fetch 2 test products from Odoo and dump ALL fields
 * 
 * Usage: npx medusa exec ./src/scripts/debug-odoo-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import OdooSyncService, { ODOO_PRODUCT_TEMPLATE_FIELDS } from "../modules/odoo-sync/service"

export default async function debugOdooProducts({ container }: ExecArgs) {
  console.log("\n" + "═".repeat(70))
  console.log("  🔍 ODOO PRODUCT FIELD DIAGNOSTIC")
  console.log("═".repeat(70))

  const odoo = new OdooSyncService()
  if (!odoo.isConfigured()) {
    console.error("❌ Odoo not configured")
    return
  }

  const authOk = await odoo.authenticate()
  if (!authOk) {
    console.error("❌ Odoo auth failed")
    return
  }

  // Search for the two test products
  const searchTerms = ["Samsung Galaxy S25 Ultra", "Marshall Minor III"]

  for (const term of searchTerms) {
    console.log(`\n${"─".repeat(70)}`)
    console.log(`  🔎 Searching: "${term}"`)
    console.log("─".repeat(70))

    try {
      // Use direct search_read via JSON-RPC through the service's fetchProducts
      // We'll search by name containing our term
      const allProducts = await odoo.fetchProducts(5, 0)
      
      // Also do a targeted search
      // Since fetchProducts filters by sale_ok=true, let's also try fetchProductById approach
      // But we need the ID first. Let's search differently.
      
      // Actually let me authenticate and use raw JSON-RPC to search by name
      const axios = require("axios")
      const url = process.env.ODOO_URL || ""
      const db = process.env.ODOO_DB_NAME || ""
      const username = process.env.ODOO_USERNAME || ""
      const password = process.env.ODOO_PASSWORD || process.env.ODOO_API_KEY || ""

      // Search for product by name
      const searchResult = await axios.post(`${url}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            db,
            2, // we need UID; let's authenticate first
            password,
            "product.template",
            "search_read",
            [[["name", "ilike", term]]],
            {
              fields: [...ODOO_PRODUCT_TEMPLATE_FIELDS],
              limit: 1,
            },
          ],
        },
        id: Date.now(),
      })

      // Try with the authenticated UID
      const authResult = await axios.post(`${url}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "common",
          method: "authenticate",
          args: [db, username, password, {}],
        },
        id: Date.now(),
      })

      const uid = authResult.data.result
      if (!uid) {
        console.error("  ❌ Auth failed for raw query")
        continue
      }

      const productResult = await axios.post(`${url}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            db,
            uid,
            password,
            "product.template",
            "search_read",
            [[["name", "ilike", term]]],
            {
              fields: [...ODOO_PRODUCT_TEMPLATE_FIELDS],
              limit: 1,
            },
          ],
        },
        id: Date.now(),
      })

      if (productResult.data.error) {
        console.error("  ❌ Odoo error:", productResult.data.error.message || JSON.stringify(productResult.data.error.data))
        
        // If there's a field error, try to identify which field is invalid
        const errorMsg = JSON.stringify(productResult.data.error)
        console.log("\n  📋 Error details:")
        console.log("  ", errorMsg.substring(0, 500))
        continue
      }

      const products = productResult.data.result || []
      if (products.length === 0) {
        console.log(`  ⚠️  No product found matching "${term}"`)
        continue
      }

      const product = products[0]
      console.log(`\n  ✅ Found: "${product.name}" (ID: ${product.id})`)
      console.log(`  📋 Total fields received: ${Object.keys(product).length}`)

      // Print ALL fields grouped by category
      console.log("\n  ── CORE ──")
      console.log(`    name:          ${product.name}`)
      console.log(`    default_code:  ${product.default_code}`)
      console.log(`    barcode:       ${product.barcode}`)
      console.log(`    type:          ${product.type}`)
      console.log(`    active:        ${product.active}`)
      console.log(`    sequence:      ${product.sequence}`)
      console.log(`    is_favorite:   ${product.is_favorite}`)

      console.log("\n  ── PRICES ──")
      console.log(`    list_price:         ${product.list_price}`)
      console.log(`    standard_price:     ${product.standard_price}`)
      console.log(`    compare_list_price: ${product.compare_list_price}`)
      console.log(`    retail_price:       ${product.retail_price}`)
      console.log(`    currency_id:        ${JSON.stringify(product.currency_id)}`)

      console.log("\n  ── DESCRIPTIONS ──")
      console.log(`    description:          ${product.description ? String(product.description).substring(0, 80) : false}`)
      console.log(`    description_sale:     ${product.description_sale ? String(product.description_sale).substring(0, 80) : false}`)
      console.log(`    description_ecommerce: ${product.description_ecommerce ? String(product.description_ecommerce).substring(0, 80) : false}`)

      console.log("\n  ── BRAND & CATEGORY ──")
      console.log(`    brand_id:            ${JSON.stringify(product.brand_id)}`)
      console.log(`    categ_id:            ${JSON.stringify(product.categ_id)}`)
      console.log(`    public_categ_ids:    ${JSON.stringify(product.public_categ_ids)}`)
      console.log(`    x_studio_brand_1:    ${product.x_studio_brand_1}`)
      console.log(`    x_studio_sub_category: ${product.x_studio_sub_category}`)

      console.log("\n  ── INVENTORY & LOGISTICS ──")
      console.log(`    qty_available:       ${product.qty_available}`)
      console.log(`    virtual_available:   ${product.virtual_available}`)
      console.log(`    incoming_qty:        ${product.incoming_qty}`)
      console.log(`    outgoing_qty:        ${product.outgoing_qty}`)
      console.log(`    is_storable:         ${product.is_storable}`)
      console.log(`    weight:              ${product.weight}`)
      console.log(`    volume:              ${product.volume}`)
      console.log(`    weight_uom_name:     ${product.weight_uom_name}`)
      console.log(`    volume_uom_name:     ${product.volume_uom_name}`)
      console.log(`    hs_code:             ${product.hs_code}`)
      console.log(`    country_of_origin:   ${JSON.stringify(product.country_of_origin)}`)
      console.log(`    sale_delay:          ${product.sale_delay}`)
      console.log(`    allow_out_of_stock_order: ${product.allow_out_of_stock_order}`)
      console.log(`    out_of_stock_message: ${product.out_of_stock_message}`)
      console.log(`    show_availability:   ${product.show_availability}`)
      console.log(`    available_threshold: ${product.available_threshold}`)
      console.log(`    uom_id:             ${JSON.stringify(product.uom_id)}`)
      console.log(`    uom_name:           ${product.uom_name}`)

      console.log("\n  ── IMAGES ──")
      console.log(`    image_1920:          ${product.image_1920 ? `[base64 ${String(product.image_1920).length} chars]` : false}`)
      console.log(`    product_template_image_ids: ${JSON.stringify(product.product_template_image_ids)}`)
      console.log(`    can_image_1024_be_zoomed:  ${product.can_image_1024_be_zoomed}`)

      console.log("\n  ── VARIANTS & ATTRIBUTES ──")
      console.log(`    attribute_line_ids:        ${JSON.stringify(product.attribute_line_ids)}`)
      console.log(`    product_variant_ids:       ${JSON.stringify(product.product_variant_ids)}`)
      console.log(`    product_variant_count:     ${product.product_variant_count}`)
      console.log(`    has_configurable_attributes: ${product.has_configurable_attributes}`)

      console.log("\n  ── SEO & WEBSITE ──")
      console.log(`    seo_name:            ${product.seo_name}`)
      console.log(`    website_meta_title:  ${product.website_meta_title}`)
      console.log(`    website_meta_description: ${product.website_meta_description}`)
      console.log(`    website_meta_keywords: ${product.website_meta_keywords}`)
      console.log(`    website_meta_og_img: ${product.website_meta_og_img}`)
      console.log(`    is_published:        ${product.is_published}`)
      console.log(`    website_url:         ${product.website_url}`)
      console.log(`    website_sequence:    ${product.website_sequence}`)
      console.log(`    website_ribbon_id:   ${JSON.stringify(product.website_ribbon_id)}`)
      console.log(`    product_tag_ids:     ${JSON.stringify(product.product_tag_ids)}`)

      console.log("\n  ── SALES & CROSS-SELL ──")
      console.log(`    optional_product_ids:    ${JSON.stringify(product.optional_product_ids)}`)
      console.log(`    accessory_product_ids:   ${JSON.stringify(product.accessory_product_ids)}`)
      console.log(`    alternative_product_ids: ${JSON.stringify(product.alternative_product_ids)}`)
      console.log(`    sales_count:             ${product.sales_count}`)
      console.log(`    combo_ids:               ${JSON.stringify(product.combo_ids)}`)
      console.log(`    sale_ok:                 ${product.sale_ok}`)
      console.log(`    purchase_ok:             ${product.purchase_ok}`)

      console.log("\n  ── RATINGS ──")
      console.log(`    rating_avg:          ${product.rating_avg}`)
      console.log(`    rating_count:        ${product.rating_count}`)
      console.log(`    rating_percentage_satisfaction: ${product.rating_percentage_satisfaction}`)
      console.log(`    rating_last_feedback: ${product.rating_last_feedback}`)
      console.log(`    rating_last_value:   ${product.rating_last_value}`)

      console.log("\n  ── VENDORS ──")
      console.log(`    seller_ids:          ${JSON.stringify(product.seller_ids)}`)

      console.log("\n  ── TIMESTAMPS ──")
      console.log(`    create_date:         ${product.create_date}`)
      console.log(`    write_date:          ${product.write_date}`)

      // Now test convertToMedusaProduct
      console.log("\n  ── MEDUSA CONVERSION TEST ──")
      const medusa = odoo.convertToMedusaProduct(product)
      console.log(`    title:       ${medusa.title}`)
      console.log(`    subtitle:    ${medusa.subtitle}`)
      console.log(`    handle:      ${medusa.handle}`)
      console.log(`    status:      ${medusa.status}`)
      console.log(`    weight:      ${medusa.weight}`)
      console.log(`    description: ${medusa.description ? String(medusa.description).substring(0, 80) : null}`)
      console.log(`\n    metadata fields: ${Object.keys(medusa.metadata).length}`)
      
      // Print all metadata keys and values
      for (const [key, val] of Object.entries(medusa.metadata)) {
        const display = val === null ? "null" 
          : Array.isArray(val) ? `[${(val as any[]).length} items]` 
          : typeof val === "string" && val.length > 60 ? val.substring(0, 60) + "..." 
          : String(val)
        console.log(`      ${key}: ${display}`)
      }

      // Check for any fields returned by Odoo that we DON'T have in our fields list
      const ourFields = new Set<string>([...ODOO_PRODUCT_TEMPLATE_FIELDS])
      const odooFields = Object.keys(product)
      const unmappedFields = odooFields.filter(f => !ourFields.has(f))
      if (unmappedFields.length > 0) {
        console.log(`\n  ⚠️  UNMAPPED FIELDS (returned by Odoo but not in our list): ${unmappedFields.join(", ")}`)
      }

      // Also fetch variants if they exist
      if (product.product_variant_count > 1) {
        console.log(`\n  ── VARIANTS (${product.product_variant_count}) ──`)
        try {
          const variants = await odoo.fetchVariantsByTemplate(product.id)
          for (const v of variants) {
            console.log(`    Variant ID ${v.id}: "${v.display_name}" SKU=${v.default_code} Price=${v.list_price} Qty=${v.qty_available}`)
          }
        } catch (e: any) {
          console.warn(`    ⚠️ Variant fetch failed: ${e.message}`)
        }
      }

      // Fetch attribute lines
      if (product.attribute_line_ids?.length > 0) {
        console.log(`\n  ── ATTRIBUTE LINES ──`)
        try {
          const attrLines = await odoo.fetchAttributeLines(product.attribute_line_ids)
          for (const al of attrLines) {
            const attrName = al.attribute_id ? al.attribute_id[1] : "?"
            const values = await odoo.fetchAttributeValues(al.value_ids)
            const valueNames = values.map(v => `${v.name}${v.html_color ? ` (${v.html_color})` : ""}`).join(", ")
            console.log(`    ${attrName}: ${valueNames}`)
          }
        } catch (e: any) {
          console.warn(`    ⚠️ Attribute fetch failed: ${e.message}`)
        }
      }

      // Fetch gallery images
      if (product.product_template_image_ids?.length > 0) {
        console.log(`\n  ── GALLERY IMAGES (${product.product_template_image_ids.length}) ──`)
        try {
          const images = await odoo.fetchProductImages(product.product_template_image_ids)
          for (const img of images) {
            console.log(`    Image ${img.id}: "${img.name}" seq=${img.sequence} [${img.image_1920 ? `${String(img.image_1920).length} chars` : "no data"}]`)
          }
        } catch (e: any) {
          console.warn(`    ⚠️ Image fetch failed: ${e.message}`)
        }
      }

      // Fetch tags
      if (product.product_tag_ids?.length > 0) {
        console.log(`\n  ── TAGS ──`)
        try {
          const tags = await odoo.fetchTags(product.product_tag_ids)
          for (const t of tags) console.log(`    Tag: "${t.name}" (color: ${t.color})`)
        } catch (e: any) {
          console.warn(`    ⚠️ Tag fetch failed: ${e.message}`)
        }
      }

      // Fetch vendors
      if (product.seller_ids?.length > 0) {
        console.log(`\n  ── VENDORS ──`)
        try {
          const vendors = await odoo.fetchVendors(product.seller_ids)
          for (const v of vendors) {
            const name = v.partner_id ? v.partner_id[1] : "Unknown"
            const curr = v.currency_id ? v.currency_id[1] : "?"
            console.log(`    ${name}: ${v.price} ${curr}, lead ${v.delay} days, min qty ${v.min_qty}`)
          }
        } catch (e: any) {
          console.warn(`    ⚠️ Vendor fetch failed: ${e.message}`)
        }
      }

    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`)
      // Show the full error for debugging
      if (error.response?.data?.error) {
        const errData = error.response.data.error
        console.error(`  Error type: ${errData.message}`)
        if (errData.data?.message) {
          console.error(`  Detail: ${errData.data.message}`)
        }
      }
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log("  ✅ DIAGNOSTIC COMPLETE")
  console.log("═".repeat(70) + "\n")
}
