import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import https from "https"

export const AUTHENTICATE = false

const ODOO_BASE_URL = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com"
const ODOO_DB = process.env.ODOO_DB || "oskarllc-new-27289548"
const ODOO_USERNAME = process.env.ODOO_USERNAME || "SYG"
const ODOO_API_KEY = process.env.ODOO_API_KEY || "fa8410bdf3264b91ea393b9f8341626a98ca262a"

function odooRpc(path: string, payload: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const url = new URL(path, ODOO_BASE_URL)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res: any) => {
      let data = ""
      res.on("data", (chunk: any) => (data += chunk))
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) reject(new Error(parsed.error.data?.message || "Odoo RPC error"))
          else resolve(parsed.result)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

async function getOdooUid(): Promise<number> {
  return odooRpc("/web/dataset/call_kw", {
    jsonrpc: "2.0",
    method: "call",
    id: 1,
    params: {
      model: "res.users",
      method: "authenticate",
      args: [],
      kwargs: {
        db: ODOO_DB,
        login: ODOO_USERNAME,
        password: ODOO_API_KEY,
      },
    },
  })
}

async function fetchOdooBrands(uid: number): Promise<any[]> {
  return odooRpc("/web/dataset/call_kw", {
    jsonrpc: "2.0",
    method: "call",
    id: 2,
    params: {
      model: "product.brand",
      method: "search_read",
      args: [[]],
      kwargs: {
        fields: ["id", "name", "logo"],
        limit: 100,
        uid,
        db: ODOO_DB,
        password: ODOO_API_KEY,
      },
    },
  })
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
      .filter((b: any) => b.logo) // only brands that have a logo in Odoo
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

