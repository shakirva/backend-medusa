import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../../modules/warranty"

export const AUTHENTICATE = true

// GET /admin/warranty/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const [items] = await svc.listAndCountWarranties({ id }, { take: 1 })
  res.json({ warranty: items?.[0] || null })
}

// PATCH /admin/warranty/:id
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const raw = (req.body || {}) as any
  const update: any = {}
  if (typeof raw.status === "string") update.status = raw.status.trim()
  if (typeof raw.end_date === "string") update.end_date = new Date(raw.end_date)
  if (typeof raw.terms === "string") update.terms = raw.terms.trim()
  const warranty = await svc.updateWarranties({ id }, update)
  res.json({ warranty })
}
