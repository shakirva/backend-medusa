import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../modules/sellers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const [items, count] = await svc.listAndCountSellers({ status: "approved" }, { take: 100 })
  res.json({ sellers: items, count })
}
