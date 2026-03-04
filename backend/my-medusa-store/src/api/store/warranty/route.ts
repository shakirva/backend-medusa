import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WARRANTY_MODULE } from "../../../modules/warranty"

// GET /store/warranty?email=customer@example.com
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const email = (req.query?.email as string | undefined)?.toString().trim()
  if (!email) {
    return res.status(400).json({ message: "email is required" })
  }
  const [items, count] = await svc.listAndCountWarranties({ customer_email: email }, { take: 200 })
  res.json({ warranties: items, count })
}

// POST /store/warranty
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(WARRANTY_MODULE) as any
  const body = (req.body || {}) as any

  const product_id = (body.product_id || "").toString().trim()
  const customer_email = (body.customer_email || "").toString().trim()
  const type = (body.type || "manufacturer").toString().trim()
  const duration_months = body.duration_months ? Number(body.duration_months) : 12
  const order_id = body.order_id ? body.order_id.toString().trim() : null
  const order_item_id = body.order_item_id ? body.order_item_id.toString().trim() : null

  if (!/.+@.+\..+/.test(customer_email)) {
    return res.status(400).json({ message: "valid customer_email is required" })
  }
  if (!product_id || !product_id.startsWith("prod_")) {
    return res.status(400).json({ message: "invalid product_id" })
  }
  if (!Number.isFinite(duration_months) || duration_months <= 0) {
    return res.status(400).json({ message: "duration_months must be positive" })
  }

  const warranty = await svc.registerWarranty({
    product_id,
    customer_email,
    type,
    duration_months,
    order_id,
    order_item_id,
  })
  res.status(201).json({ warranty })
}
