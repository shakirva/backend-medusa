import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../modules/sellers"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const status = (req.query.status as string) || undefined
  const [items, count] = await svc.listAndCountSellerRequests(status ? { status } : {}, { take: 200 })
  res.json({ requests: items, count })
}
