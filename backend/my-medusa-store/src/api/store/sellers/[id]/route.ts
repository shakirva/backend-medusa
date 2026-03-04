import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../../modules/sellers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id } = req.params
  const [items] = await svc.listAndCountSellers({ id, status: "approved" }, { take: 1 })
  const seller = items?.[0] || null
  // Optionally fetch product links
  const links = await svc.listSellerProductLinks({ seller_id: id })
  res.json({ seller, product_links: links })
}
