import { Module } from "@medusajs/framework/utils"
import MediaService from "./service"

export const MEDIA_MODULE = "mediaModuleService"

export default Module(MEDIA_MODULE, {
  service: MediaService,
})
