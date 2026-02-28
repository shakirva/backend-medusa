import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../modules/sellers"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const [items, count] = await svc.listAndCountSellers({}, { take: 200 })
  res.json({ sellers: items, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const body = (req.body || {}) as any
  const name = (body.name ?? "").toString().trim()
  const email = (body.email ?? "").toString().trim()
  const phone = body.phone ? body.phone.toString().trim() : null
  const store_name = body.store_name ? body.store_name.toString().trim() : undefined
  const statusRaw = (body.status ?? "").toString().trim()
  const emailOk = /.+@.+\..+/.test(email)
  if (!name || !emailOk) {
    return res.status(400).json({ message: "name and valid email are required" })
  }
  const status = statusRaw === "active" ? "approved" : statusRaw === "inactive" ? "suspended" : undefined
  const seller = await svc.createSellers({ name, email, phone, status: status ?? undefined, metadata: store_name ? { store_name } : undefined })
  res.json({ seller })
}
