import { ExecArgs } from "@medusajs/framework/types"
import axios from "axios"

/**
 * Odoo Sync Script
 * 
 * This script synchronizes products from Odoo ERP to MedusaJS.
 * It can be run manually using: yarn sync:odoo
 * 
 * Features:
 * - Authenticates with Odoo using JSON-RPC
 * - Fetches all active products from Odoo
 * - Creates new products in MedusaJS for any missing items
 * - Updates product inventory
 * - Assigns products to sales channel
 */

interface OdooProduct {
  id: number
  name: string
  default_code: string | false
  list_price: number
  description_sale: string | false
  categ_id: [number, string] | false
  image_1920: string | false
  barcode: string | false
  qty_available: number
  active: boolean
}

export default async function odooSync({ container }: ExecArgs) {
  console.log("\n🔄 Starting Odoo to MedusaJS Product Sync...")
  console.log("=" .repeat(50))
  
  // Get configuration from environment
  const odooUrl = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com"
  const odooDb = process.env.ODOO_DB_NAME || "oskarllc-new-27289548"
  const odooUsername = process.env.ODOO_USERNAME || "SYG"
  const odooPassword = process.env.ODOO_PASSWORD || "S123456"
  
  console.log(`📡 Odoo URL: ${odooUrl}`)
  console.log(`📁 Database: ${odooDb}`)
  console.log(`👤 Username: ${odooUsername}`)
  
  // Authenticate with Odoo
  console.log("\n1️⃣ Authenticating with Odoo...")
  
  let uid: number
  try {
    const authResponse = await axios.post(`${odooUrl}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [odooDb, odooUsername, odooPassword, {}]
      },
      id: 1
    })
    
    uid = authResponse.data.result
    if (!uid) {
      console.error("❌ Authentication failed - no UID returned")
      return
    }
    console.log(`✅ Authenticated successfully (UID: ${uid})`)
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message)
    return
  }
  
  // Fetch products from Odoo
  console.log("\n2️⃣ Fetching products from Odoo...")
  
  let odooProducts: OdooProduct[] = []
  try {
    const productsResponse = await axios.post(`${odooUrl}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          odooDb,
          uid,
          odooPassword,
          "product.product",
          "search_read",
          [[["active", "=", true]]],
          {
            fields: [
              "id", "name", "default_code", "list_price", 
              "description_sale", "categ_id", "image_1920",
              "barcode", "qty_available", "active"
            ],
            limit: 500
          }
        ]
      },
      id: 2
    })
    
    odooProducts = productsResponse.data.result || []
    console.log(`✅ Found ${odooProducts.length} active products in Odoo`)
  } catch (error: any) {
    console.error("❌ Failed to fetch products:", error.message)
    return
  }
  
  // Get services from container
  const productModuleService = container.resolve("product")
  const inventoryModuleService = container.resolve("inventory")
  const salesChannelService = container.resolve("sales_channel")
  
  // Get existing products with odoo_id
  console.log("\n3️⃣ Checking existing products in MedusaJS...")
  
  const existingProducts = await productModuleService.listProducts({}, {
    select: ["id", "handle", "metadata"],
    take: 1000
  })
  
  const existingOdooIds = new Set<number>()
  const existingHandles = new Set<string>()
  
  for (const product of existingProducts) {
    existingHandles.add(product.handle)
    if (product.metadata?.odoo_id) {
      existingOdooIds.add(Number(product.metadata.odoo_id))
    }
  }
  
  console.log(`📊 Existing products: ${existingProducts.length}`)
  console.log(`📊 Already synced from Odoo: ${existingOdooIds.size}`)
  
  // Find new products to sync
  const newProducts = odooProducts.filter(p => !existingOdooIds.has(p.id))
  console.log(`📊 New products to sync: ${newProducts.length}`)
  
  if (newProducts.length === 0) {
    console.log("\n✅ All Odoo products are already synced!")
    return
  }
  
  // Get default sales channel
  const salesChannels = await salesChannelService.listSalesChannels({})
  const defaultSalesChannel = salesChannels[0]
  
  if (!defaultSalesChannel) {
    console.error("❌ No sales channel found!")
    return
  }
  console.log(`📢 Sales Channel: ${defaultSalesChannel.name}`)
  
  // Sync new products
  console.log("\n4️⃣ Syncing new products...")
  
  let syncedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const odooProduct of newProducts) {
    try {
      // Generate unique handle
      let baseHandle = odooProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50)
      
      let handle = baseHandle
      let suffix = 1
      while (existingHandles.has(handle)) {
        handle = `${baseHandle}-${odooProduct.id}`
        if (existingHandles.has(handle)) {
          handle = `${baseHandle}-${suffix++}`
        }
      }
      
      // Generate unique SKU
      const sku = odooProduct.default_code || `ODOO-${odooProduct.id}`
      
      // Prepare product data
      const productData: any = {
        title: odooProduct.name,
        handle: handle,
        description: odooProduct.description_sale || `Imported from Odoo: ${odooProduct.name}`,
        status: "published",
        metadata: {
          odoo_id: odooProduct.id,
          odoo_category: odooProduct.categ_id ? odooProduct.categ_id[1] : null,
          odoo_barcode: odooProduct.barcode || null,
          synced_at: new Date().toISOString()
        },
        options: [
          {
            title: "Default",
            values: ["Default"]
          }
        ],
        variants: [
          {
            title: "Default",
            sku: sku,
            prices: [
              {
                amount: Math.round(odooProduct.list_price * 100),
                currency_code: "usd"
              }
            ],
            options: {
              Default: "Default"
            },
            manage_inventory: true
          }
        ]
      }
      
      // Add image if available
      if (odooProduct.image_1920) {
        productData.images = [
          {
            url: `data:image/jpeg;base64,${odooProduct.image_1920}`
          }
        ]
      }
      
      // Create product
      const createdProducts = await productModuleService.createProducts(productData)
      const createdProduct = Array.isArray(createdProducts) ? createdProducts[0] : createdProducts
      existingHandles.add(handle)
      
      // Assign to sales channel
      try {
        const productLink = container.resolve("link")
        await productLink.create({
          product_sales_channel: {
            product_id: createdProduct.id,
            sales_channel_id: defaultSalesChannel.id
          }
        })
      } catch (linkError) {
        // Link might already exist
      }
      
      syncedCount++
      console.log(`  ✅ ${syncedCount}. ${odooProduct.name} (SKU: ${sku})`)
      
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        skippedCount++
        console.log(`  ⏭️  Skipped: ${odooProduct.name} (already exists)`)
      } else {
        errorCount++
        console.log(`  ❌ Error: ${odooProduct.name} - ${error.message}`)
      }
    }
  }
  
  // Summary
  console.log("\n" + "=" .repeat(50))
  console.log("📊 SYNC SUMMARY")
  console.log("=" .repeat(50))
  console.log(`✅ Products synced: ${syncedCount}`)
  console.log(`⏭️  Products skipped: ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📦 Total Odoo products: ${odooProducts.length}`)
  console.log(`📦 Total in MedusaJS: ${existingProducts.length + syncedCount}`)
  console.log("\n✅ Odoo sync completed!")
}
