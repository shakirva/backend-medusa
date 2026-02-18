/**
 * Odoo Sync Service
 * Handles the synchronization logic between Odoo and MedusaJS
 */

import axios, { AxiosInstance } from "axios"
import https from "https"

// Types for Odoo products
export interface OdooProduct {
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
  product_tmpl_id?: [number, string]
  attribute_line_ids?: number[]
  currency_id?: [number, string]
}

export interface OdooCategory {
  id: number
  name: string
  parent_id: [number, string] | false
  complete_name: string
}

export interface OdooStockQuant {
  id: number
  product_id: [number, string]
  location_id: [number, string]
  quantity: number
  reserved_quantity: number
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
  timestamp: string
}

export interface OdooConfig {
  url: string
  dbName: string
  username: string
  password: string
}

/**
 * Odoo Sync Service
 */
class OdooSyncService {
  private config: OdooConfig
  private client: AxiosInstance | null = null
  private uid: number | null = null
  private requestId = 0

  constructor() {
    // Load configuration from environment variables
    this.config = {
      url: process.env.ODOO_URL || "",
      dbName: process.env.ODOO_DB_NAME || "",
      username: process.env.ODOO_USERNAME || "",
      password: process.env.ODOO_PASSWORD || process.env.ODOO_API_KEY || "",
    }
  }

  /**
   * Check if Odoo is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.url &&
      this.config.dbName &&
      this.config.username &&
      this.config.password
    )
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Partial<OdooConfig> {
    return {
      url: this.config.url,
      dbName: this.config.dbName,
      username: this.config.username,
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: OdooConfig): void {
    this.config = config
    this.client = null
    this.uid = null
  }

  /**
   * Create axios client for Odoo
   */
  private createClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: this.config.url,
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certs for dev
        }),
        timeout: 30000,
      })
    }
    return this.client
  }

  /**
   * Make JSON-RPC call to Odoo
   */
  private async jsonRpc(
    url: string,
    method: string,
    params: Record<string, any>
  ): Promise<any> {
    const client = this.createClient()
    const request = {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: ++this.requestId,
    }

    const response = await client.post(url, request)

    if (response.data.error) {
      const errorMessage =
        response.data.error.message ||
        response.data.error.data?.message ||
        "Unknown Odoo error"
      throw new Error(`Odoo Error: ${errorMessage}`)
    }

    return response.data.result
  }

  /**
   * Authenticate with Odoo using JSON-RPC
   */
  async authenticate(): Promise<boolean> {
    try {
      const result = await this.jsonRpc("/jsonrpc", "call", {
        service: "common",
        method: "authenticate",
        args: [this.config.dbName, this.config.username, this.config.password, {}]
      })

      if (result && typeof result === 'number' && result > 0) {
        this.uid = result
        console.log("Odoo authentication successful, UID:", this.uid)
        return true
      }
      console.error("Odoo authentication failed: Invalid response", result)
      return false
    } catch (error: any) {
      console.error("Odoo authentication failed:", error.message)
      return false
    }
  }

  /**
   * Execute Odoo model method using JSON-RPC
   */
  private async executeKw(
    model: string,
    method: string,
    args: any[],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    if (!this.uid) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        throw new Error("Failed to authenticate with Odoo")
      }
    }

    const result = await this.jsonRpc("/jsonrpc", "call", {
      service: "object",
      method: "execute_kw",
      args: [
        this.config.dbName,
        this.uid,
        this.config.password,
        model,
        method,
        args,
        kwargs
      ]
    })

    return result
  }

  /**
   * Search and read records from Odoo
   */
  private async searchRead(
    model: string,
    domain: any[],
    fields: string[],
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    return await this.executeKw(
      model,
      "search_read",
      [domain],
      { fields, limit, offset }
    )
  }

  /**
   * Fetch all products from Odoo
   */
  async fetchProducts(
    limit: number = 100,
    offset: number = 0
  ): Promise<OdooProduct[]> {
    if (!this.uid) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        throw new Error("Failed to authenticate with Odoo")
      }
    }

    const products = await this.searchRead(
      "product.product",
      [["active", "=", true], ["sale_ok", "=", true]],
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
        "product_tmpl_id",
        "attribute_line_ids",
        "currency_id",
      ],
      limit,
      offset
    )

    return products as OdooProduct[]
  }

  /**
   * Fetch all categories from Odoo
   */
  async fetchCategories(): Promise<OdooCategory[]> {
    if (!this.uid) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        throw new Error("Failed to authenticate with Odoo")
      }
    }

    const categories = await this.searchRead(
      "product.category",
      [],
      ["id", "name", "parent_id", "complete_name"],
      500
    )

    return categories as OdooCategory[]
  }

  /**
   * Fetch inventory/stock levels from Odoo
   */
  async fetchInventory(): Promise<OdooStockQuant[]> {
    if (!this.uid) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        throw new Error("Failed to authenticate with Odoo")
      }
    }

    const quants = await this.searchRead(
      "stock.quant",
      [["quantity", ">", 0]],
      ["id", "product_id", "location_id", "quantity", "reserved_quantity"],
      1000
    )

    return quants as OdooStockQuant[]
  }

  /**
   * Get product count from Odoo
   */
  async getProductCount(): Promise<number> {
    if (!this.uid) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        throw new Error("Failed to authenticate with Odoo")
      }
    }

    const result = await this.jsonRpc("/web/dataset/call_kw", "call", {
      model: "product.product",
      method: "search_count",
      args: [[["active", "=", true], ["sale_ok", "=", true]]],
      kwargs: {},
    })

    return result || 0
  }

  /**
   * Convert Odoo product to MedusaJS product format
   */
  convertToMedusaProduct(odooProduct: OdooProduct): Record<string, any> {
    // Generate handle from product name
    const handle = odooProduct.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100)

    return {
      title: odooProduct.name,
      subtitle: null,
      description:
        (odooProduct.description_sale as string) ||
        (odooProduct.description as string) ||
        null,
      handle: handle,
      is_giftcard: false,
      status: "published",
      thumbnail: null, // Will need image processing
      weight: odooProduct.weight || 0,
      metadata: {
        odoo_id: odooProduct.id,
        odoo_sku: odooProduct.default_code || null,
        odoo_barcode: odooProduct.barcode || null,
        odoo_stock: Math.floor(odooProduct.qty_available || 0),
        odoo_price: odooProduct.list_price ?? null,
        odoo_category_id: odooProduct.categ_id
          ? odooProduct.categ_id[0]
          : null,
        odoo_category_name: odooProduct.categ_id
          ? odooProduct.categ_id[1]
          : null,
        cost_price: odooProduct.standard_price,
        synced_at: new Date().toISOString(),
      },
      variants: [
        {
          title: "Default",
          sku: (odooProduct.default_code as string) || `ODOO-${odooProduct.id}`,
          inventory_quantity: Math.floor(odooProduct.qty_available || 0),
          // Keep amount management separate from Odoo sync.
          // Price is stored in metadata (odoo_price) for reference only.
          prices: [],
          metadata: {
            odoo_product_id: odooProduct.id,
          },
        },
      ],
    }
  }

  /**
   * Test connection to Odoo
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: "Odoo is not configured. Please set ODOO_URL, ODOO_DB_NAME, ODOO_USERNAME, and ODOO_API_KEY environment variables.",
        }
      }

      const authenticated = await this.authenticate()
      if (!authenticated) {
        return {
          success: false,
          message: "Authentication failed. Please check your credentials.",
        }
      }

      const productCount = await this.getProductCount()
      const categories = await this.fetchCategories()

      return {
        success: true,
        message: "Successfully connected to Odoo",
        data: {
          userId: this.uid,
          productCount,
          categoryCount: categories.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      }
    }
  }
}

export default OdooSyncService
