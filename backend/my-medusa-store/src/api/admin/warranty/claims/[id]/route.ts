import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../../../modules/warranty"

export const AUTHENTICATE = true

// GET /admin/warranty/claims/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const [items] = await svc.listAndCountWarrantyClaims({ id }, { take: 1 })
  res.json({ claim: items?.[0] || null })
}

// PATCH /admin/warranty/claims/:id
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const raw = (req.body || {}) as any
  const update: any = {}
  if (typeof raw.status === "string") update.status = raw.status.trim()
  if (typeof raw.admin_notes === "string") update.admin_notes = raw.admin_notes.trim()
  const claim = await svc.updateWarrantyClaims({ id }, update)
  res.json({ claim })
}
