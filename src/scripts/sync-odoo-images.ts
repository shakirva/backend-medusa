import { ExecArgs } from "@medusajs/framework/types"
import axios from "axios"
import * as fs from "fs"
import * as path from "path"

/**
 * Sync Odoo Product Images
 * 
 * This script downloads images from Odoo and saves them locally,
 * then updates the product image URLs in MedusaJS.
 * 
 * Run with: yarn sync:images
 */

interface ProductWithImage {
  id: string
  title: string
  metadata: {
    odoo_id?: number
  }
}

// Odoo configuration
const ODOO_URL = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com"
const ODOO_DB = process.env.ODOO_DB_NAME || "oskarllc-new-27289548"
const ODOO_USERNAME = process.env.ODOO_USERNAME || "SYG"
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "S123456"

// Image storage path
const UPLOAD_DIR = path.join(process.cwd(), "static", "uploads", "products")

export default async function syncOdooImages({ container }: ExecArgs) {
  console.log("\n🖼️  Starting Odoo Image Sync...")
  console.log("=" .repeat(50))
  
  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    console.log(`📁 Created upload directory: ${UPLOAD_DIR}`)
  }
  
  // Authenticate with Odoo
  console.log("\n1️⃣  Authenticating with Odoo...")
  
  let uid: number
  try {
    const authResponse = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]
      },
      id: 1
    })
    
    uid = authResponse.data.result
    if (!uid) {
      console.error("❌ Authentication failed")
      return
    }
    console.log(`✅ Authenticated (UID: ${uid})`)
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message)
    return
  }
  
  // Get database connection
  const { Pool } = require("pg")
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev",
  })
  
  // Get all products with odoo_id that don't have images yet
  console.log("\n2️⃣  Finding products that need images...")
  
  const productsResult = await pool.query(`
    SELECT p.id, p.title, p.metadata
    FROM product p
    WHERE p.metadata->>'odoo_id' IS NOT NULL
    AND p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM image i 
      WHERE i.product_id = p.id 
      AND i.deleted_at IS NULL
    )
    ORDER BY p.created_at DESC
    LIMIT 300
  `)
  
  const productsWithoutImages: ProductWithImage[] = productsResult.rows
  console.log(`📦 Found ${productsWithoutImages.length} products needing images`)
  
  if (productsWithoutImages.length === 0) {
    console.log("✅ All products already have images!")
    await pool.end()
    return
  }
  
  // Get Odoo IDs for these products
  const odooIds = productsWithoutImages
    .map(p => p.metadata?.odoo_id)
    .filter(Boolean)
  
  // Fetch images from Odoo
  console.log("\n3️⃣  Fetching images from Odoo...")
  
  let odooProducts: any[] = []
  try {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          ODOO_DB,
          uid,
          ODOO_PASSWORD,
          "product.product",
          "search_read",
          [[["id", "in", odooIds]]],
          {
            fields: ["id", "name", "image_1920", "image_128"],
            limit: 500
          }
        ]
      },
      id: 2
    })
    
    odooProducts = response.data.result || []
    console.log(`✅ Fetched ${odooProducts.length} products from Odoo`)
  } catch (error: any) {
    console.error("❌ Failed to fetch from Odoo:", error.message)
    await pool.end()
    return
  }
  
  // Create a map of Odoo ID to image data
  const odooImageMap = new Map<number, string>()
  for (const product of odooProducts) {
    // Prefer image_1920 (full size), fallback to image_128 (thumbnail)
    const imageData = product.image_1920 || product.image_128
    if (imageData && imageData !== false) {
      odooImageMap.set(product.id, imageData)
    }
  }
  
  console.log(`📷 Products with images: ${odooImageMap.size}`)
  
  // Process and save images
  console.log("\n4️⃣  Saving images locally...")
  
  let savedCount = 0
  let errorCount = 0
  let noImageCount = 0
  
  for (const product of productsWithoutImages) {
    const odooId = product.metadata?.odoo_id
    if (!odooId) continue
    
    const base64Image = odooImageMap.get(odooId)
    
    if (!base64Image) {
      noImageCount++
      continue
    }
    
    try {
      // Decode base64 and save to file
      const imageBuffer = Buffer.from(base64Image, "base64")
      
      // Determine file extension (usually JPEG from Odoo)
      // Check magic bytes
      let extension = "jpg"
      if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
        extension = "png"
      } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
        extension = "gif"
      }
      
      // Create filename
      const filename = `odoo-${odooId}.${extension}`
      const filePath = path.join(UPLOAD_DIR, filename)
      
      // Save file
      fs.writeFileSync(filePath, imageBuffer)
      
      // Create image URL (relative to static folder)
      const imageUrl = `/static/uploads/products/${filename}`
      
      // Insert image record into database
      const imageId = `img_odoo_${odooId}_${Date.now()}`
      await pool.query(
        `INSERT INTO image (id, product_id, url, rank, created_at, updated_at)
         VALUES ($1, $2, $3, 0, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [imageId, product.id, imageUrl]
      )
      
      savedCount++
      if (savedCount % 20 === 0) {
        console.log(`  ✅ Saved ${savedCount} images...`)
      }
      
    } catch (error: any) {
      errorCount++
      console.log(`  ❌ Error saving image for ${product.title}: ${error.message}`)
    }
  }
  
  // Close database connection
  await pool.end()
  
  // Summary
  console.log("\n" + "=" .repeat(50))
  console.log("📊 IMAGE SYNC SUMMARY")
  console.log("=" .repeat(50))
  console.log(`✅ Images saved: ${savedCount}`)
  console.log(`📷 No image in Odoo: ${noImageCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📁 Location: ${UPLOAD_DIR}`)
  console.log("\n✅ Image sync completed!")
}
