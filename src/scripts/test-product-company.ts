import { ExecArgs } from "@medusajs/framework/types"
import axios from "axios"

const ODOO_URL = process.env.ODOO_URL || "https://oskarllc-new-31031096.dev.odoo.com"
const ODOO_DB = process.env.ODOO_DB_NAME || "oskarllc-stage-27028831"
const ODOO_USER = process.env.ODOO_USERNAME || "SYG"
const ODOO_API_KEY = process.env.ODOO_API_KEY || ""

export default async function testOdoo({ container }: ExecArgs) {
  try {
    const auth = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0", method: "call",
      params: { service: "common", method: "authenticate", args: [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}] }, id: 1
    })
    const uid = auth.data.result
    
    const prod = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0", method: "call",
      params: { service: "object", method: "execute_kw", args: [ODOO_DB, uid, ODOO_API_KEY, "product.product", "read", [[113264], ["name", "company_id"]]] }, id: 2
    })
    console.log("Product Product:", JSON.stringify(prod.data.result))
    
    if (!prod.data.result || prod.data.result.length === 0) {
      const tmpl = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: "2.0", method: "call",
        params: { service: "object", method: "execute_kw", args: [ODOO_DB, uid, ODOO_API_KEY, "product.template", "read", [[113264], ["name", "company_id", "product_variant_id"]]] }, id: 3
      })
      console.log("Product Template:", JSON.stringify(tmpl.data.result))
    }
  } catch (error) {
    console.error(error)
  }
}
