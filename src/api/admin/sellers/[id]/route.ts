import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../../modules/sellers"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id } = req.params
  const [items] = await svc.listAndCountSellers({ id }, { take: 1 })
  res.json({ seller: items?.[0] || null })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id } = req.params
  const raw = (req.body || {}) as any
  const update: any = {}
  if (typeof raw.name === "string") update.name = raw.name.trim()
  if (typeof raw.email === "string") {
    const email = raw.email.trim()
    if (!/.+@.+\..+/.test(email)) {
      return res.status(400).json({ message: "invalid email" })
    }
    update.email = email
  }
  if (typeof raw.phone === "string") update.phone = raw.phone.trim()
  if (typeof raw.store_name === "string") {
    update.metadata = { ...(update.metadata || {}), store_name: raw.store_name.trim() }
  }
  if (typeof raw.status === "string") {
    const sr = raw.status.trim()
    update.status = sr === "active" ? "approved" : sr === "inactive" ? "suspended" : sr
  }
  const seller = await svc.updateSellers({ id }, update)
  res.json({ seller })
}
