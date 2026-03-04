/**
 * Odoo Auto-Sync Job
 * Automatically syncs new products from Odoo every 5 minutes
 */

import { MedusaContainer } from "@medusajs/framework/types"
import https from "https"
import * as fs from "fs"
import * as path from "path"

interface OdooProduct {
  id: number
  name: string
  default_code: string | false
  list_price: number
  barcode: string | false
  categ_id: [number, string] | false
  qty_available: number
  image_1920: string | false
  create_date: string
  write_date: string
}

// Odoo configuration
const ODOO_CONFIG = {
  url: process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com",
  db: process.env.ODOO_DB_NAME || "oskarllc-new-27289548",
  username: process.env.ODOO_USERNAME || "SYG",
  password: process.env.ODOO_PASSWORD || "S123456",
}

async function odooJsonRpc(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
    })

    const url = new URL(ODOO_CONFIG.url)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: "/jsonrpc",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }

    const req = https.request(options, (res) => {
      let body = ""
      res.on("data", (chunk) => (body += chunk))
      res.on("end", () => {
        try {
          const result = JSON.parse(body)
          if (result.error) {
            reject(new Error(result.error.message || "Odoo error"))
          } else {
            resolve(result.result)
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on("error", reject)
    req.write(data)
    req.end()
  })
}

async function authenticateOdoo(): Promise<number> {
  const uid = await odooJsonRpc("call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
  })
  return uid
}

async function fetchNewOdooProducts(uid: number, lastSyncDate?: string): Promise<OdooProduct[]> {
  const domain: any[] = [["sale_ok", "=", true]]
  
  // If we have a last sync date, only get products created/modified after that
  if (lastSyncDate) {
    domain.push("|")
    domain.push(["create_date", ">", lastSyncDate])
    domain.push(["write_date", ">", lastSyncDate])
  }

  const products = await odooJsonRpc("call", {
    service: "object",
    method: "execute_kw",
    args: [
      ODOO_CONFIG.db,
      uid,
      ODOO_CONFIG.password,
      "product.product",
      "search_read",
      [domain],
      {
        fields: [
          "id", "name", "default_code", "list_price", "barcode",
          "categ_id", "qty_available", "image_1920", "create_date", "write_date"
        ],
        limit: 500,
      },
    ],
  })

  return products
}

export default async function odooSyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  
  logger.info("🔄 Starting Odoo auto-sync job...")

  try {
    // Get database connection
    const { Pool } = require("pg")
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev",
    })

    // Authenticate with Odoo
    const uid = await authenticateOdoo()
    if (!uid) {
      logger.error("Failed to authenticate with Odoo")
      return
    }

    logger.info(`✅ Authenticated with Odoo (UID: ${uid})`)

    // Get last sync timestamp from database (or use a default)
    let lastSyncDate: string | undefined
    try {
      const lastSyncResult = await pool.query(
        "SELECT value FROM system_config WHERE key = 'odoo_last_sync' LIMIT 1"
      )
      if (lastSyncResult.rows.length > 0) {
        lastSyncDate = lastSyncResult.rows[0].value
      }
    } catch (e) {
      // Table might not exist, that's ok
    }

    // Fetch new/updated products from Odoo
    const odooProducts = await fetchNewOdooProducts(uid, lastSyncDate)
    logger.info(`📦 Found ${odooProducts.length} products from Odoo`)

    if (odooProducts.length === 0) {
      logger.info("✅ No new products to sync")
      await pool.end()
      return
    }

    // Get existing products from MedusaJS by handle
    const existingProducts = await pool.query(
      "SELECT id, handle, metadata FROM product"
    )
    const existingHandles = new Set(existingProducts.rows.map((p: any) => p.handle))
    const existingOdooIds = new Set(
      existingProducts.rows
        .filter((p: any) => p.metadata?.odoo_id)
        .map((p: any) => p.metadata.odoo_id)
    )

    // Get sales channel
    const salesChannelResult = await pool.query(
      "SELECT id FROM sales_channel LIMIT 1"
    )
    const salesChannelId = salesChannelResult.rows[0]?.id

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const product of odooProducts) {
      const handle = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100)

      const sku = product.default_code || `ODOO-${product.id}`

      // Check if product already exists by Odoo ID
      if (existingOdooIds.has(product.id)) {
        // Update existing product
        try {
          await pool.query(
            `UPDATE product SET 
              title = $1,
              updated_at = NOW()
            WHERE metadata->>'odoo_id' = $2`,
            [product.name, product.id.toString()]
          )
          updated++
        } catch (e) {
          // Skip update errors
        }
        continue
      }

      // Check if handle already exists
      if (existingHandles.has(handle)) {
        skipped++
        continue
      }

      try {
        // Create new product
        const productId = `prod_${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        
        await pool.query(
          `INSERT INTO product (id, title, handle, status, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, 'published', $4, NOW(), NOW())`,
          [
            productId,
            product.name,
            handle,
            JSON.stringify({
              odoo_id: product.id,
              odoo_sku: sku,
              odoo_barcode: product.barcode || null,
              odoo_category: product.categ_id ? product.categ_id[1] : null,
              synced_at: new Date().toISOString(),
            }),
          ]
        )

        // Create variant
        const variantId = `variant_${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        await pool.query(
          `INSERT INTO product_variant (id, product_id, title, sku, metadata, created_at, updated_at)
           VALUES ($1, $2, 'Default', $3, $4, NOW(), NOW())`,
          [
            variantId,
            productId,
            sku,
            JSON.stringify({ odoo_id: product.id }),
          ]
        )

        // Create price (in AED)
        const priceId = `price_${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        await pool.query(
          `INSERT INTO product_variant_price_set (variant_id, price_set_id)
           SELECT $1, id FROM price_set LIMIT 1
           ON CONFLICT DO NOTHING`,
          [variantId]
        )

        // Add to sales channel
        if (salesChannelId) {
          await pool.query(
            `INSERT INTO product_sales_channel (product_id, sales_channel_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [productId, salesChannelId]
          )
        }

        // Handle image if exists - save base64 to file
        if (product.image_1920) {
          try {
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), "static", "uploads", "products")
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }
            
            // Decode base64 and save to file
            const imageBuffer = Buffer.from(product.image_1920, "base64")
            
            // Determine file extension
            let extension = "jpg"
            if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
              extension = "png"
            }
            
            const filename = `odoo-${product.id}.${extension}`
            const filePath = path.join(uploadDir, filename)
            fs.writeFileSync(filePath, imageBuffer)
            
            // Create image URL
            const imageUrl = `/static/uploads/products/${filename}`
            const imageId = `img_${Date.now()}${Math.random().toString(36).substr(2, 9)}`
            
            await pool.query(
              `INSERT INTO image (id, product_id, url, rank, created_at, updated_at)
               VALUES ($1, $2, $3, 0, NOW(), NOW())`,
              [imageId, productId, imageUrl]
            )
          } catch (e) {
            // Skip image errors
          }
        }

        existingHandles.add(handle)
        existingOdooIds.add(product.id)
        imported++

        logger.info(`✅ Imported: ${product.name}`)
      } catch (error: any) {
        logger.warn(`⚠️ Failed to import ${product.name}: ${error.message}`)
      }
    }

    // Update last sync timestamp
    try {
      await pool.query(
        `INSERT INTO system_config (key, value) VALUES ('odoo_last_sync', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [new Date().toISOString()]
      )
    } catch (e) {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_config (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT
        )
      `)
      await pool.query(
        `INSERT INTO system_config (key, value) VALUES ('odoo_last_sync', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [new Date().toISOString()]
      )
    }

    await pool.end()

    logger.info(`
✅ Odoo sync completed!
   - Imported: ${imported} new products
   - Updated: ${updated} existing products  
   - Skipped: ${skipped} (already exist)
    `)
  } catch (error: any) {
    logger.error(`❌ Odoo sync failed: ${error.message}`)
  }
}

// Job configuration
export const config = {
  name: "odoo-product-sync",
  // Run every 5 minutes
  schedule: "*/5 * * * *",
}
