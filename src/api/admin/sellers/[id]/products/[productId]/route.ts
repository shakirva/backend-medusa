import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../../../../modules/sellers"

export const AUTHENTICATE = true

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id, productId } = req.params
  await svc.removeProductFromSeller(id, productId)
  res.status(204).send()
}
