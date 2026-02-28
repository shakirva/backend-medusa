/**
 * Odoo Integration Module
 * Handles synchronization of products and inventory from Odoo ERP to MedusaJS
 */

import { Module } from "@medusajs/framework/utils"
import OdooSyncService from "./service"

export const ODOO_SYNC_MODULE = "odoo-sync"

export default Module(ODOO_SYNC_MODULE, {
  service: OdooSyncService,
})
