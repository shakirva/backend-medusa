import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../../modules/warranty"

// GET /store/warranty/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const [items] = await svc.listAndCountWarranties({ id }, { take: 1 })
  if (!items?.length) return res.status(404).json({ message: "warranty not found" })
  res.json({ warranty: items[0] })
}
