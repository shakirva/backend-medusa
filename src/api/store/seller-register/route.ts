import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../modules/sellers"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const body = (req.body || {}) as any

  // Basic validation + mapping (minimal compatible with UI)
  const name = (body.name ?? body.seller_name ?? "").toString().trim()
  const email = (body.email ?? "").toString().trim()
  const phone = (body.phone ?? "").toString().trim() || null
  const notes = (body.message ?? body.notes ?? "").toString().trim() || null
  const documents_urls = Array.isArray(body.documents_urls) ? body.documents_urls : []
  const store_name = body.store_name ? body.store_name.toString().trim() : undefined

  const emailOk = /.+@.+\..+/.test(email)
  if (!name || !emailOk) {
    return res.status(400).json({ message: "name and valid email are required" })
  }

  const request = await svc.createSellerRequests({
    seller_name: name,
    email,
    phone,
    documents_urls,
    notes,
    metadata: store_name ? { store_name } : undefined,
  })
  res.json({ request })
}
