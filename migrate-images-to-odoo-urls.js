/**
 * Migration Script: Convert local image paths to Odoo direct URLs
 * 
 * This script updates all product images and thumbnails in the database
 * from local file paths (/static/uploads/products/odoo-{id}.*) 
 * to direct Odoo URLs ({ODOO_URL}/web/image/product.product/{id}/image_1920)
 * 
 * Run: node migrate-images-to-odoo-urls.js
 * 
 * Safe to run multiple times (idempotent).
 */

const { Pool } = require('pg');

const ODOO_URL = process.env.ODOO_URL || "https://oskarllc-new-27289548.dev.odoo.com";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev";

async function migrateImages() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log("🔄 Migrating image URLs to Odoo direct URLs...\n");
  console.log(`   Odoo URL: ${ODOO_URL}`);
  console.log(`   Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

  // ── Step 1: Show current state ──
  const localImages = await pool.query(
    "SELECT COUNT(*) as c FROM image WHERE (url LIKE '/static/uploads/%' OR url LIKE 'http://localhost%' OR url LIKE 'http://127.0.0.1%') AND deleted_at IS NULL"
  );
  const localThumbnails = await pool.query(
    "SELECT COUNT(*) as c FROM product WHERE (thumbnail LIKE '/static/uploads/%' OR thumbnail LIKE 'http://localhost%' OR thumbnail LIKE 'http://127.0.0.1%') AND deleted_at IS NULL"
  );
  const odooImages = await pool.query(
    `SELECT COUNT(*) as c FROM image WHERE url LIKE '${ODOO_URL}%' AND deleted_at IS NULL`
  );

  console.log("📊 BEFORE MIGRATION:");
  console.log(`   Local image URLs: ${localImages.rows[0].c}`);
  console.log(`   Local thumbnail URLs: ${localThumbnails.rows[0].c}`);
  console.log(`   Already Odoo URLs: ${odooImages.rows[0].c}`);
  console.log("");

  // ── Step 2: Get all products with odoo_id that have local image URLs ──
  const productsWithLocalImages = await pool.query(`
    SELECT p.id, p.metadata->>'odoo_id' as odoo_id, p.thumbnail
    FROM product p
    WHERE p.metadata->>'odoo_id' IS NOT NULL
    AND p.deleted_at IS NULL
    AND (
      p.thumbnail LIKE '/static/uploads/%' 
      OR p.thumbnail LIKE 'http://localhost%'
      OR p.thumbnail LIKE 'http://127.0.0.1%'
      OR p.thumbnail LIKE '%admin.markasouqs.com/static/uploads/%'
    )
  `);

  console.log(`🖼️  Products with local thumbnails to migrate: ${productsWithLocalImages.rowCount}`);

  let thumbnailsUpdated = 0;
  for (const product of productsWithLocalImages.rows) {
    const odooId = product.odoo_id;
    const newUrl = `${ODOO_URL}/web/image/product.product/${odooId}/image_1920`;

    await pool.query(
      "UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2",
      [newUrl, product.id]
    );
    thumbnailsUpdated++;
  }
  console.log(`   ✅ Updated ${thumbnailsUpdated} product thumbnails\n`);

  // ── Step 3: Update image table entries ──
  // Get all local images that belong to products with odoo_id
  const localImageRecords = await pool.query(`
    SELECT i.id, i.product_id, i.url, p.metadata->>'odoo_id' as odoo_id
    FROM image i
    JOIN product p ON p.id = i.product_id
    WHERE p.metadata->>'odoo_id' IS NOT NULL
    AND p.deleted_at IS NULL
    AND i.deleted_at IS NULL
    AND (
      i.url LIKE '/static/uploads/%' 
      OR i.url LIKE 'http://localhost%'
      OR i.url LIKE 'http://127.0.0.1%'
      OR i.url LIKE '%admin.markasouqs.com/static/uploads/%'
    )
  `);

  console.log(`🖼️  Image records with local URLs to migrate: ${localImageRecords.rowCount}`);

  let imagesUpdated = 0;
  for (const img of localImageRecords.rows) {
    const odooId = img.odoo_id;
    const newUrl = `${ODOO_URL}/web/image/product.product/${odooId}/image_1920`;

    await pool.query(
      "UPDATE image SET url = $1, updated_at = NOW() WHERE id = $2",
      [newUrl, img.id]
    );
    imagesUpdated++;
  }
  console.log(`   ✅ Updated ${imagesUpdated} image records\n`);

  // ── Step 4: Also update any product_image table entries (used by sync-now) ──
  try {
    const productImageRecords = await pool.query(`
      SELECT pi.id, pi.product_id, pi.url, p.metadata->>'odoo_id' as odoo_id
      FROM product_image pi
      JOIN product p ON p.id = pi.product_id
      WHERE p.metadata->>'odoo_id' IS NOT NULL
      AND (
        pi.url LIKE '/static/uploads/%' 
        OR pi.url LIKE 'http://localhost%'
        OR pi.url LIKE 'http://127.0.0.1%'
      )
    `);

    let productImagesUpdated = 0;
    for (const img of productImageRecords.rows) {
      const odooId = img.odoo_id;
      const newUrl = `${ODOO_URL}/web/image/product.product/${odooId}/image_1920`;

      await pool.query(
        "UPDATE product_image SET url = $1, updated_at = NOW() WHERE id = $2",
        [newUrl, img.id]
      );
      productImagesUpdated++;
    }
    if (productImagesUpdated > 0) {
      console.log(`   ✅ Updated ${productImagesUpdated} product_image records\n`);
    }
  } catch (e) {
    // product_image table may not exist in all setups
  }

  // ── Step 5: Show final state ──
  const finalLocalImages = await pool.query(
    "SELECT COUNT(*) as c FROM image WHERE (url LIKE '/static/uploads/%' OR url LIKE 'http://localhost%') AND deleted_at IS NULL"
  );
  const finalOdooImages = await pool.query(
    `SELECT COUNT(*) as c FROM image WHERE url LIKE '${ODOO_URL}%' AND deleted_at IS NULL`
  );
  const finalThumbnails = await pool.query(
    `SELECT COUNT(*) as c FROM product WHERE thumbnail LIKE '${ODOO_URL}%' AND deleted_at IS NULL`
  );

  console.log("📊 AFTER MIGRATION:");
  console.log(`   Local image URLs remaining: ${finalLocalImages.rows[0].c}`);
  console.log(`   Odoo direct image URLs: ${finalOdooImages.rows[0].c}`);
  console.log(`   Product thumbnails with Odoo URLs: ${finalThumbnails.rows[0].c}`);

  // Show sample URLs
  const samples = await pool.query(
    `SELECT url FROM image WHERE url LIKE '${ODOO_URL}%' AND deleted_at IS NULL LIMIT 3`
  );
  if (samples.rowCount > 0) {
    console.log("\n📎 Sample URLs:");
    samples.rows.forEach(r => console.log(`   ${r.url}`));
  }

  console.log("\n✅ Migration complete!");
  console.log("💡 You can now safely delete the /static/uploads/products/ folder to free disk space.");
  
  await pool.end();
}

migrateImages().catch(console.error);
