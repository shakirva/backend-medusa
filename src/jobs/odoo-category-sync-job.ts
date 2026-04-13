/**
 * Odoo Category Sync Job
 *
 * Runs every 1 HOUR automatically.
 * Syncs all public categories from Odoo → Medusa.
 *
 * This is the PERMANENT SOLUTION so that when the Odoo developer
 * adds new categories (parent or subcategory), they automatically
 * appear in the website and admin dashboard within 1 hour.
 *
 * The job calls the same logic as POST /admin/odoo/sync-categories.
 * To trigger immediately: POST /admin/odoo/sync-categories
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import OdooSyncService from "../modules/odoo-sync/service"
import fs from "fs"
import path from "path"

const CATEGORIES_UPLOAD_DIR = path.join(process.cwd(), "static", "uploads", "categories")
const CATEGORIES_URL_PREFIX = "/static/uploads/categories"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100)
}

function saveBase64Image(base64Data: string | false, dir: string, filename: string): string | null {
  if (!base64Data || typeof base64Data !== "string") return null
  const buffer = Buffer.from(base64Data, "base64")
  if (buffer.length < 100) return null
  let ext = "jpg"
  if (buffer[0] === 0x89 && buffer[1] === 0x50) ext = "png"
  else if (buffer[0] === 0x47 && buffer[1] === 0x49) ext = "gif"
  else if (buffer[0] === 0x52 && buffer[1] === 0x49) ext = "webp"
  const fullFilename = `${filename}.${ext}`
  fs.writeFileSync(path.join(dir, fullFilename), buffer)
  return fullFilename
}

export default async function odooCategorySyncJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const productService = container.resolve(Modules.PRODUCT)

  logger.info("[Category Sync Job] ⏰ Starting hourly Odoo category sync...")

  const odoo = new OdooSyncService()
  if (!odoo.isConfigured()) {
    logger.warn("[Category Sync Job] Odoo not configured, skipping.")
    return
  }

  const connectionTest = await odoo.testConnection()
  if (!connectionTest.success) {
    logger.warn(`[Category Sync Job] Odoo unreachable: ${connectionTest.message}`)
    return
  }

  // Ensure upload dir
  if (!fs.existsSync(CATEGORIES_UPLOAD_DIR)) {
    fs.mkdirSync(CATEGORIES_UPLOAD_DIR, { recursive: true })
  }

  // Ensure system_config table
  await pgConnection.raw(`
    CREATE TABLE IF NOT EXISTS system_config (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})

  let created = 0
  let updated = 0
  let errors = 0

  try {
    const odooCategories = await odoo.fetchPublicCategories()

    if (odooCategories.length === 0) {
      logger.info("[Category Sync Job] No public categories found in Odoo.")
      return
    }

    logger.info(`[Category Sync Job] Fetched ${odooCategories.length} categories from Odoo.`)

    const odooIdToHandle = new Map<number, string>()
    const rootCategories = odooCategories.filter(c => !c.parent_id)
    const childCategories = odooCategories.filter(c => !!c.parent_id)

    const processCategory = async (oCategory: any, parentMedusaId: string | null) => {
      try {
        const handle = slugify(oCategory.name)
        if (!handle) return
        odooIdToHandle.set(oCategory.id, handle)

        let imageUrl: string | null = null
        if (oCategory.image_128 && typeof oCategory.image_128 === "string") {
          const filename = saveBase64Image(oCategory.image_128, CATEGORIES_UPLOAD_DIR, `cat-${handle}`)
          if (filename) imageUrl = `${CATEGORIES_URL_PREFIX}/${filename}`
        }

        const metadata = { image_url: imageUrl, odoo_id: oCategory.id }

        const existing = await pgConnection.raw(
          `SELECT id FROM product_category WHERE handle = ? LIMIT 1`,
          [handle]
        )

        if (existing.rows.length > 0) {
          await pgConnection.raw(
            `UPDATE product_category
             SET name = ?,
                 parent_category_id = ?,
                 metadata = COALESCE(metadata, '{}')::jsonb || ?::jsonb,
                 deleted_at = NULL,
                 updated_at = NOW()
             WHERE handle = ?`,
            [oCategory.name, parentMedusaId, JSON.stringify(metadata), handle]
          )
          updated++
        } else {
          await productService.createProductCategories({
            name: oCategory.name,
            handle,
            parent_category_id: parentMedusaId,
            is_active: true,
            metadata,
          })
          created++
          logger.info(`[Category Sync Job] ✅ New category: "${oCategory.name}"`)
        }
      } catch (err: any) {
        errors++
        logger.warn(`[Category Sync Job] ❌ "${oCategory.name}": ${err.message}`)
      }
    }

    // Root categories first
    for (const cat of rootCategories) {
      await processCategory(cat, null)
    }

    // Then children
    for (const cat of childCategories) {
      const parentOdooId = Array.isArray(cat.parent_id) ? cat.parent_id[0] : null
      const parentHandle = parentOdooId ? odooIdToHandle.get(parentOdooId) : null

      let parentMedusaId: string | null = null
      if (parentHandle) {
        const row = await pgConnection.raw(
          `SELECT id FROM product_category WHERE handle = ? AND deleted_at IS NULL LIMIT 1`,
          [parentHandle]
        )
        parentMedusaId = row.rows[0]?.id || null
      }

      await processCategory(cat, parentMedusaId)
    }

    // Record last sync time
    await pgConnection.raw(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ('odoo_last_category_sync', ?, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [new Date().toISOString()]
    ).catch(() => {})

    logger.info(
      `[Category Sync Job] ✅ Done — Created: ${created}, Updated: ${updated}, Errors: ${errors} | Total Odoo: ${odooCategories.length}`
    )
  } catch (err: any) {
    logger.error(`[Category Sync Job] Fatal error: ${err.message}`)
  }
}

// ─── Medusa Cron Schedule ─────────────────────────────────────────────────────
export const config = {
  name: "odoo-category-sync",
  schedule: "*/5 * * * *",   // every 5 minutes
}
