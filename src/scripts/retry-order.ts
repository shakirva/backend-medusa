import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import orderCreatedHandler from "../subscribers/order-to-odoo"

export default async function retryOrder({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  const orderId = "order_01KVZ8PXFXN4ZQTAM9BR1TA4ZM"
  logger.info(`Retrying order sync for ${orderId}`)
  
  await orderCreatedHandler({
    event: { data: { id: orderId }, name: "order.placed" } as any,
    container,
    pluginOptions: {}
  })
}
