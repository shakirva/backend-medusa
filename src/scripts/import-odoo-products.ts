/**
 * Import Odoo Products to MedusaJS
 * 
 * This script fetches all products from Odoo and creates them in MedusaJS.
 * It will replace the existing demo products with real Odoo products.
 * 
 * Usage: npx medusa exec ./src/scripts/import-odoo-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import https from "https"

interface OdooProduct {
  id: number
  name: string
  default_code: string | false
  list_price: number
  standard_price: number
  description_sale: string | false
  categ_id: [number, string] | false
  qty_available: number
  barcode: string | false
  weight: number
  image_1920: string | false
}

// Odoo JSON-RPC helper
async function odooJsonRpc(
  hostname: string,
  db: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  args: any[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [db, uid, password, model, method, ...args],
      },
      id: Date.now(),
    })

    const options = {
      hostname,
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

// Authenticate with Odoo
async function authenticateOdoo(
  hostname: string,
  db: string,
  username: string,
  password: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, username, password, {}],
      },
      id: 1,
    })

    const options = {
      hostname,
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
          if (result.result === false) {
            reject(new Error("Authentication failed"))
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100)
}

export default async function importOdooProducts({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productService = container.resolve(Modules.PRODUCT)
  const regionService = container.resolve(Modules.REGION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("=== ODOO PRODUCT IMPORT ===")
  logger.info("")

  // Get Odoo config from environment
  const odooUrl = process.env.ODOO_URL || ""
  const odooDb = process.env.ODOO_DB_NAME || ""
  const odooUsername = process.env.ODOO_USERNAME || ""
  const odooPassword = process.env.ODOO_PASSWORD || ""

  if (!odooUrl || !odooDb || !odooUsername || !odooPassword) {
    logger.error("Missing Odoo configuration. Please set:")
    logger.error("  ODOO_URL, ODOO_DB_NAME, ODOO_USERNAME, ODOO_PASSWORD")
    return
  }

  const hostname = new URL(odooUrl).hostname
  logger.info(`Connecting to Odoo: ${hostname}`)

  // Authenticate
  let uid: number
  try {
    uid = await authenticateOdoo(hostname, odooDb, odooUsername, odooPassword)
    logger.info(`Authenticated with Odoo! UID: ${uid}`)
  } catch (error: any) {
    logger.error(`Authentication failed: ${error.message}`)
    return
  }

  // Fetch products from Odoo
  logger.info("Fetching products from Odoo...")
  let odooProducts: OdooProduct[]
  try {
    odooProducts = await odooJsonRpc(
      hostname,
      odooDb,
      uid,
      odooPassword,
      "product.product",
      "search_read",
      [
        [[["sale_ok", "=", true]]],
        {
          fields: [
            "id",
            "name",
            "default_code",
            "list_price",
            "standard_price",
            "description_sale",
            "categ_id",
            "qty_available",
            "barcode",
            "weight",
          ],
          limit: 500,
        },
      ]
    )
    logger.info(`Fetched ${odooProducts.length} products from Odoo`)
  } catch (error: any) {
    logger.error(`Failed to fetch products: ${error.message}`)
    return
  }

  // Get default region and sales channel
  const regions = await regionService.listRegions({}, { take: 1 })
  const salesChannels = await salesChannelService.listSalesChannels({}, { take: 1 })

  if (regions.length === 0) {
    logger.error("No regions found. Please create a region first.")
    return
  }

  const defaultRegion = regions[0]
  const defaultSalesChannel = salesChannels[0]
  logger.info(`Using region: ${defaultRegion.name}`)
  logger.info(`Using sales channel: ${defaultSalesChannel?.name || "None"}`)

  // Get existing products
  const existingProducts = await productService.listProducts({}, { take: 1000 })
  logger.info(`Found ${existingProducts.length} existing products in MedusaJS`)

  // Option 1: Delete old demo products first (uncomment if needed)
  // logger.info("Deleting old demo products...")
  // for (const product of existingProducts) {
  //   if (!product.metadata?.odoo_id) {
  //     await productService.deleteProducts([product.id])
  //     logger.info(`Deleted: ${product.title}`)
  //   }
  // }

  let created = 0
  let updated = 0
  let errors: string[] = []

  for (const odooProduct of odooProducts) {
    try {
      const sku = odooProduct.default_code || `ODOO-${odooProduct.id}`
      const handle = slugify(odooProduct.name)

      // Check if product already exists (by odoo_id in metadata)
      const existingProduct = existingProducts.find(
        (p: any) => p.metadata?.odoo_id === odooProduct.id
      )

      if (existingProduct) {
        // Update existing product
        await productService.updateProducts(existingProduct.id, {
          title: odooProduct.name,
          description: odooProduct.description_sale || undefined,
          metadata: {
            ...existingProduct.metadata,
            odoo_id: odooProduct.id,
            odoo_sku: sku,
            odoo_category: odooProduct.categ_id ? odooProduct.categ_id[1] : null,
            odoo_stock: odooProduct.qty_available,
            odoo_last_sync: new Date().toISOString(),
          },
        })
        updated++
      } else {
        // Create new product
        const newProduct = await productService.createProducts({
          title: odooProduct.name,
          handle: handle,
          description: odooProduct.description_sale || undefined,
          status: "published",
          metadata: {
            odoo_id: odooProduct.id,
            odoo_sku: sku,
            odoo_category: odooProduct.categ_id ? odooProduct.categ_id[1] : null,
            odoo_stock: odooProduct.qty_available,
            odoo_barcode: odooProduct.barcode || null,
            odoo_price: odooProduct.list_price,
            odoo_last_sync: new Date().toISOString(),
          },
          variants: [
            {
              title: "Default",
              sku: sku,
              barcode: odooProduct.barcode || undefined,
              manage_inventory: true,
              metadata: {
                odoo_stock: odooProduct.qty_available,
                odoo_price: odooProduct.list_price,
              },
            },
          ],
          options: [],
        })

        created++
        logger.info(`Created: ${odooProduct.name} (${sku}) - ${odooProduct.list_price} AED`)
      }
    } catch (error: any) {
      errors.push(`${odooProduct.name}: ${error.message}`)
      logger.warn(`Error with ${odooProduct.name}: ${error.message}`)
    }
  }

  logger.info("")
  logger.info("=== IMPORT SUMMARY ===")
  logger.info(`Created: ${created}`)
  logger.info(`Updated: ${updated}`)
  logger.info(`Errors: ${errors.length}`)
  if (errors.length > 0) {
    logger.info("Error details:")
    errors.slice(0, 10).forEach((e) => logger.info(`  - ${e}`))
  }
  logger.info("")
  logger.info("Import complete! Refresh the admin dashboard to see the new products.")
}
