import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../../../modules/sellers"

export const AUTHENTICATE = true

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id } = req.params
  const body = req.body as any
  const productId = (body.product_id || "").toString().trim()
  if (!productId || !productId.startsWith("prod_")) {
    return res.status(400).json({ message: "invalid product_id" })
  }
  const link = await svc.addProductToSeller(id, productId, body.display_order || 0)
  res.json({ link })
}
