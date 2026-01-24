import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import axios from "axios"

/**
 * Order Created Subscriber
 * 
 * When an order is created in MedusaJS, this subscriber
 * will create a corresponding sale order in Odoo.
 */

const ODOO_URL = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com"
const ODOO_DB = process.env.ODOO_DB_NAME || "oskarllc-new-27289548"
const ODOO_USER = process.env.ODOO_USERNAME || "SYG"
const ODOO_PASS = process.env.ODOO_PASSWORD || "S123456"

async function authenticateOdoo(): Promise<number | null> {
  try {
    const response = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [ODOO_DB, ODOO_USER, ODOO_PASS, {}]
      },
      id: 1
    })
    return response.data.result || null
  } catch (error) {
    console.error("Odoo authentication failed:", error)
    return null
  }
}

async function createOdooOrder(uid: number, orderData: any): Promise<number | null> {
  try {
    // First, find or create the customer in Odoo
    const customerEmail = orderData.email || orderData.customer?.email
    const customerName = `${orderData.shipping_address?.first_name || ""} ${orderData.shipping_address?.last_name || ""}`.trim() || "Guest Customer"
    
    // Search for existing partner
    let partnerId: number
    const partnerSearch = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [ODOO_DB, uid, ODOO_PASS, "res.partner", "search", [[["email", "=", customerEmail]]]]
      },
      id: 2
    })
    
    if (partnerSearch.data.result && partnerSearch.data.result.length > 0) {
      partnerId = partnerSearch.data.result[0]
    } else {
      // Create new partner
      const partnerCreate = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [ODOO_DB, uid, ODOO_PASS, "res.partner", "create", [{
            name: customerName,
            email: customerEmail,
            phone: orderData.shipping_address?.phone || "",
            street: orderData.shipping_address?.address_1 || "",
            city: orderData.shipping_address?.city || "",
            zip: orderData.shipping_address?.postal_code || "",
            customer_rank: 1
          }]]
        },
        id: 3
      })
      partnerId = partnerCreate.data.result
    }
    
    // Create sale order
    const orderCreate = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [ODOO_DB, uid, ODOO_PASS, "sale.order", "create", [{
          partner_id: partnerId,
          client_order_ref: orderData.id,
          note: `Order from MedusaJS - ${orderData.id}`,
          order_line: orderData.items?.map((item: any) => [0, 0, {
            name: item.title || item.variant?.title || "Product",
            product_uom_qty: item.quantity || 1,
            price_unit: (item.unit_price || 0) / 100, // Convert from cents
          }]) || []
        }]]
      },
      id: 4
    })
    
    return orderCreate.data.result || null
  } catch (error) {
    console.error("Failed to create Odoo order:", error)
    return null
  }
}

export default async function orderCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderId = event.data.id
  
  logger.info(`📦 Order created: ${orderId} - Syncing to Odoo...`)
  
  try {
    // Get order details
    const orderService = container.resolve("order")
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "customer"]
    })
    
    // Authenticate with Odoo
    const uid = await authenticateOdoo()
    if (!uid) {
      logger.warn("Could not authenticate with Odoo, order not synced")
      return
    }
    
    // Create order in Odoo
    const odooOrderId = await createOdooOrder(uid, order)
    
    if (odooOrderId) {
      logger.info(`✅ Order ${orderId} synced to Odoo as order ID: ${odooOrderId}`)
      
      // Update order metadata with Odoo ID
      // Note: This would require additional logic to update metadata
    } else {
      logger.warn(`Failed to sync order ${orderId} to Odoo`)
    }
  } catch (error: any) {
    logger.error(`Error syncing order to Odoo: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
