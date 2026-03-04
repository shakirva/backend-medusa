import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../modules/warranty"

export const AUTHENTICATE = true

// GET /admin/warranty
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const q: any = {}
  if (req.query?.email) q.customer_email = (req.query.email as string).toString().trim()
  if (req.query?.product_id) q.product_id = (req.query.product_id as string).toString().trim()
  const [items, count] = await svc.listAndCountWarranties(q, { take: 200 })
  res.json({ warranties: items, count })
}
