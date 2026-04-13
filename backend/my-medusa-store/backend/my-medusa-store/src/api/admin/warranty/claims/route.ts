import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../../modules/warranty"

export const AUTHENTICATE = true

// GET /admin/warranty/claims
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const q: any = {}
  if (req.query?.status) q.status = (req.query.status as string).toString().trim()
  if (req.query?.warranty_id) q.warranty_id = (req.query.warranty_id as string).toString().trim()
  const [items, count] = await svc.listAndCountWarrantyClaims(q, { take: 200, order: { created_at: "DESC" } })
  res.json({ claims: items, count })
}
