import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import https from "https"
import axios from "axios"

export const AUTHENTICATE = false

const ODOO_BASE_URL = "https://oskarllc-new-27289548.dev.odoo.com"
const ODOO_DB = "oskarllc-new-27289548"
const ODOO_USERNAME = "SYG"
const ODOO_API_KEY = "fa8410bdf3264b91ea393b9f8341626a98ca262a"

let _requestId = 0

const odooClient = axios.create({
  baseURL: ODOO_BASE_URL,
  headers: { "Content-Type": "application/json" },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 30000,
})

async function odooJsonRpc(service: string, method: string, args: any[]): Promise<any> {
  const res = await odooClient.post("/jsonrpc", {
    jsonrpc: "2.0",
    method: "call",
    id: ++_requestId,
    params: { service, method, args },
  })
  if (res.data.error) {
    const msg = res.data.error.data?.message || res.data.error.message || "Odoo error"
    throw new Error(msg)
  }
  return res.data.result
}

async function getOdooUid(): Promise<number> {
  const uid = await odooJsonRpc("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}])
  if (!uid || typeof uid !== "number") throw new Error("Odoo authentication failed")
  return uid
}

async function fetchOdooBrands(uid: number): Promise<any[]> {
  return odooJsonRpc("object", "execute_kw", [
    ODOO_DB, uid, ODOO_API_KEY,
    "product.brand", "search_read",
    [[]],
    { fields: ["id", "name", "logo"], limit: 100 },
  ])
}

/**
 * GET /store/brands
 * Fetches brands live from Odoo. Logo URLs point directly to Odoo image endpoint.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const uid = await getOdooUid()
    const odooBrands: any[] = await fetchOdooBrands(uid)

    const brands = odooBrands
      .filter((b: any) => b.logo) // only include brands that have a logo set in Odoo
      .map((b: any, index: number) => ({
        id: `odoo_brand_${b.id}`,
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: "",
        logo_url: `${ODOO_BASE_URL}/web/image/product.brand/${b.id}/logo`,
        banner_url: "",
        is_active: true,
        is_special: true,
        display_order: index + 1,
        product_count: 0,
        odoo_id: b.id,
      }))
      .slice(offset, offset + limit)

    res.json({ brands, count: brands.length, limit, offset })
  } catch (err: any) {
    console.error("Brands API error:", err.message)
    res.status(500).json({ error: "Failed to fetch brands from Odoo", message: err.message })
  }
}

