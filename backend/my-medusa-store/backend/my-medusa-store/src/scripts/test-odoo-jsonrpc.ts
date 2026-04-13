/**
 * Test Odoo Connection Script using JSON-RPC
 * Run with: npx ts-node src/scripts/test-odoo-jsonrpc.ts
 */

import axios, { AxiosInstance } from "axios"
import https from "https"

// Odoo credentials from the user
// Using the hosting URL - on Odoo.sh single-tenant the DB name might be empty or match subdomain
const ODOO_URL = "https://me281a.odoo.com"
// Try with empty database name (single-tenant mode) or default "odoo"
const ODOO_DB_NAME = ""  // Empty for single-tenant / auto-detect
const ODOO_USERNAME = "admin"
const ODOO_API_KEY = "bcbf8f1f9949b7bb66203265b7b88ebfd84b248f"

interface OdooProduct {
  id: number
  name: string
  default_code: string | false
  list_price: number
  standard_price: number
  description_sale: string | false
  description: string | false
  categ_id: [number, string] | false
  weight: number
  qty_available: number
  virtual_available: number
  active: boolean
  image_1920: string | false
  barcode: string | false
  type: string
}

interface JsonRpcRequest {
  jsonrpc: "2.0"
  method: string
  params: Record<string, any>
  id: number
}

/**
 * Create axios client for Odoo JSON-RPC
 */
function createOdooClient(): AxiosInstance {
  return axios.create({
    baseURL: ODOO_URL,
    headers: {
      "Content-Type": "application/json",
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // Allow self-signed certs for dev
    }),
  })
}

let requestId = 0

/**
 * Make JSON-RPC call to Odoo
 */
async function jsonRpc(
  client: AxiosInstance,
  url: string,
  method: string,
  params: Record<string, any>
): Promise<any> {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: ++requestId,
  }

  console.log(`Making request to ${url}:`, JSON.stringify(request, null, 2))

  try {
    const response = await client.post(url, request)
    
    if (response.data.error) {
      throw new Error(JSON.stringify(response.data.error))
    }
    
    return response.data.result
  } catch (error: any) {
    if (error.response) {
      console.error(`Response status: ${error.response.status}`)
      console.error(`Response data:`, error.response.data)
    }
    throw error
  }
}

/**
 * Authenticate with Odoo and get session
 */
async function authenticateOdoo(client: AxiosInstance): Promise<number | false> {
  try {
    const result = await jsonRpc(client, "/web/session/authenticate", "call", {
      db: ODOO_DB_NAME,
      login: ODOO_USERNAME,
      password: ODOO_API_KEY,
    })

    if (result && result.uid) {
      return result.uid
    }
    return false
  } catch (error) {
    console.error("Authentication error:", error)
    return false
  }
}

/**
 * Execute Odoo method using JSON-RPC
 */
async function executeOdoo(
  client: AxiosInstance,
  model: string,
  method: string,
  args: any[],
  kwargs: Record<string, any> = {}
): Promise<any> {
  return jsonRpc(client, "/web/dataset/call_kw", "call", {
    model: model,
    method: method,
    args: args,
    kwargs: kwargs,
  })
}

/**
 * Search and read records using the read controller
 */
async function searchRead(
  client: AxiosInstance,
  model: string,
  domain: any[],
  fields: string[],
  limit: number = 100,
  offset: number = 0
): Promise<any> {
  return jsonRpc(client, "/web/dataset/search_read", "call", {
    model: model,
    domain: domain,
    fields: fields,
    limit: limit,
    offset: offset,
  })
}

/**
 * Fetch products from Odoo
 */
async function fetchProducts(client: AxiosInstance): Promise<any[]> {
  try {
    const result = await searchRead(
      client,
      "product.product",
      [["active", "=", true]],
      [
        "id",
        "name",
        "default_code",
        "list_price",
        "standard_price",
        "description_sale",
        "description",
        "categ_id",
        "weight",
        "qty_available",
        "virtual_available",
        "barcode",
        "type",
        "image_1920",
      ],
      100
    )

    return result.records || result || []
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

/**
 * Fetch categories from Odoo
 */
async function fetchCategories(client: AxiosInstance): Promise<any[]> {
  try {
    const result = await searchRead(
      client,
      "product.category",
      [],
      ["id", "name", "parent_id", "complete_name"],
      100
    )

    return result.records || result || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

/**
 * Fetch inventory from Odoo
 */
async function fetchInventory(client: AxiosInstance): Promise<any[]> {
  try {
    const result = await searchRead(
      client,
      "stock.quant",
      [["quantity", ">", 0]],
      ["id", "product_id", "location_id", "quantity", "reserved_quantity"],
      100
    )

    return result.records || result || []
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return []
  }
}

/**
 * Main test function
 */
async function main() {
  console.log("🔄 Testing Odoo Connection (JSON-RPC)...")
  console.log(`URL: ${ODOO_URL}`)
  console.log(`Database: ${ODOO_DB_NAME}`)
  console.log(`Username: ${ODOO_USERNAME}`)
  console.log("---")

  const client = createOdooClient()

  try {
    // Authenticate
    console.log("\n🔐 Authenticating...")
    const uid = await authenticateOdoo(client)

    if (!uid) {
      console.error("❌ Authentication failed - invalid credentials")
      return
    }

    console.log(`✅ Authentication successful! User ID: ${uid}`)

    // Fetch categories
    console.log("\n📁 Fetching categories...")
    const categories = await fetchCategories(client)
    console.log(`Found ${categories.length} categories`)
    console.log("Categories sample:", JSON.stringify(categories.slice(0, 5), null, 2))

    // Fetch products
    console.log("\n📦 Fetching products...")
    const products = await fetchProducts(client)
    console.log(`Found ${products.length} products`)
    console.log("Products sample:")
    products.slice(0, 5).forEach((p: any) => {
      console.log(
        `  - ${p.name} (SKU: ${p.default_code || "N/A"}) - Price: ${p.list_price} - Stock: ${p.qty_available}`
      )
    })

    // Fetch inventory
    console.log("\n📊 Fetching inventory...")
    const inventory = await fetchInventory(client)
    console.log(`Found ${inventory.length} stock quants`)
    console.log("Inventory sample:", JSON.stringify(inventory.slice(0, 5), null, 2))

    // Summary
    console.log("\n" + "=".repeat(50))
    console.log("📈 SUMMARY")
    console.log("=".repeat(50))
    console.log(`Total Categories: ${categories.length}`)
    console.log(`Total Products: ${products.length}`)
    console.log(`Total Stock Quants: ${inventory.length}`)

    // Save products to JSON for review
    const fs = await import("fs")
    const outputPath = "./odoo-products-export.json"
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ categories, products, inventory }, null, 2)
    )
    console.log(`\n💾 Full data exported to: ${outputPath}`)
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

main()
