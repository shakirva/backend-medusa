import { Module } from "@medusajs/framework/utils"
import { ShippingService } from "./service"

export const SHIPPING_MODULE = "shipping"

export default Module(SHIPPING_MODULE, {
  service: ShippingService,
})
