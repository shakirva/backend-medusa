import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SELLER_MODULE } from "../../../../modules/sellers"

export const AUTHENTICATE = true

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(SELLER_MODULE) as any
  const { id } = req.params
  const body = req.body as any
  const request = await svc.updateSellerRequests({ id }, body)

  // Auto-provision Seller on approval (minimal)
  try {
    if (body?.status === "approved") {
      // fetch updated request to ensure we have latest fields
      const [reqs] = await svc.listAndCountSellerRequests({ id }, { take: 1 })
      const r = reqs?.[0]
      if (r) {
        const email = (r.email || "").trim()
        const name = (r.seller_name || email || "").trim()
        if (email) {
          const [existing] = await svc.listAndCountSellers({ email }, { take: 1 })
          if (!existing?.length) {
            await svc.createSellers({ name, email, phone: r.phone || null, status: "active", metadata: { source: "seller_request", request_id: r.id } })
          }
        }
      }
    }
  } catch (e) {
    // don't block admin action; log
    req.scope.resolve("logger").warn("seller auto-provision failed: " + (e as Error).message)
  }

  res.json({ request })
}
