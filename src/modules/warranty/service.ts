import { MedusaService } from "@medusajs/framework/utils"
import Warranty from "./models/warranty"
import WarrantyClaim from "./models/warranty_claim"

class WarrantyService extends MedusaService({ Warranty, WarrantyClaim }) {
  async registerWarranty(data: {
    product_id: string
    customer_email: string
    type?: string
    duration_months?: number
    start_date?: Date
    order_id?: string | null
    order_item_id?: string | null
    terms?: string | null
    metadata?: Record<string, any>
  }) {
    const start = data.start_date ?? new Date()
    const months = data.duration_months ?? 12
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)
    return this.createWarranties({
      product_id: data.product_id,
      order_id: data.order_id ?? null,
      order_item_id: data.order_item_id ?? null,
      customer_email: data.customer_email,
      type: data.type ?? "manufacturer",
      duration_months: months,
      start_date: start,
      end_date: end,
      status: "active",
      terms: data.terms ?? null,
      metadata: data.metadata ?? null,
    })
  }

  async submitClaim(data: {
    warranty_id: string
    customer_email: string
    issue_description: string
    metadata?: Record<string, any>
  }) {
    return this.createWarrantyClaims({
      warranty_id: data.warranty_id,
      customer_email: data.customer_email,
      issue_description: data.issue_description,
      status: "submitted",
      metadata: data.metadata ?? null,
    })
  }
}

export default WarrantyService
