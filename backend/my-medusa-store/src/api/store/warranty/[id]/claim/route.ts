import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../../../modules/warranty"

// POST /store/warranty/:id/claim
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const { id } = req.params
  const body = (req.body || {}) as any
  const email = (body.customer_email || "").toString().trim()
  const issue = (body.issue_description || "").toString().trim()

  if (!/.+@.+\..+/.test(email)) {
    return res.status(400).json({ message: "valid customer_email is required" })
  }
  if (!issue) {
    return res.status(400).json({ message: "issue_description is required" })
  }

  // ensure warranty exists and belongs to same email (minimal guard)
  const [items] = await svc.listAndCountWarranties({ id }, { take: 1 })
  const w = items?.[0]
  if (!w) return res.status(404).json({ message: "warranty not found" })
  if (w.customer_email !== email) {
    return res.status(403).json({ message: "email does not match warranty owner" })
  }

  const claim = await svc.submitClaim({ warranty_id: id, customer_email: email, issue_description: issue })
  res.status(201).json({ claim })
}
