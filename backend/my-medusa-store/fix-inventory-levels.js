/**
 * fix-inventory-levels.js
 * Creates inventory items + inventory levels for all product variants
 * that are missing them, so Add to Cart works on production.
 *
 * Run on server: node fix-inventory-levels.js
 */

const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL;
const STOCK_LOCATION_ID = 'sloc_01KAARY0FRQBBF69FEMH2K03DX';
const DEFAULT_QUANTITY = 1000000; // treat all as in-stock

function genId(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 26; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to DB');

  // Get all active variants missing inventory levels at the stock location
  const { rows: variants } = await client.query(`
    SELECT pv.id as variant_id, pv.sku, pv.title, p.title as product_title
    FROM product_variant pv
    JOIN product p ON p.id = pv.product_id
    WHERE pv.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND pv.id NOT IN (
        SELECT pvii.variant_id
        FROM product_variant_inventory_item pvii
        JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
        WHERE il.location_id = $1
          AND il.deleted_at IS NULL
          AND pvii.deleted_at IS NULL
      )
    ORDER BY pv.id
  `, [STOCK_LOCATION_ID]);

  console.log(`\n📦 Found ${variants.length} variants missing inventory levels\n`);

  if (variants.length === 0) {
    console.log('✅ All variants already have inventory levels!');
    await client.end();
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;
  const BATCH = 100;

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];

    try {
      // Check if a pvii link already exists for this variant (no deleted_at filter — catch all)
      const { rows: existingPvii } = await client.query(
        `SELECT pvii.inventory_item_id
         FROM product_variant_inventory_item pvii
         WHERE pvii.variant_id = $1 AND pvii.deleted_at IS NULL
         LIMIT 1`,
        [variant.variant_id]
      );

      let inventoryItemId;

      if (existingPvii.length > 0) {
        // Variant already linked to an inventory item — just needs a level at this location
        inventoryItemId = existingPvii[0].inventory_item_id;
      } else {
        // 1. Create new inventory item (no unique sku conflict — use variant_id as sku)
        inventoryItemId = genId('iitem');
        const safeSku = (variant.sku ? variant.sku + '_' + inventoryItemId : inventoryItemId);
        await client.query(
          `INSERT INTO inventory_item (id, sku, title, requires_shipping, created_at, updated_at)
           VALUES ($1, $2, $3, true, NOW(), NOW())`,
          [inventoryItemId, safeSku, variant.title || 'Default']
        );

        // 2. Link variant → inventory item (PK is variant_id + inventory_item_id)
        await client.query(
          `INSERT INTO product_variant_inventory_item (id, variant_id, inventory_item_id, required_quantity, created_at, updated_at)
           VALUES ($1, $2, $3, 1, NOW(), NOW())`,
          [genId('pvii'), variant.variant_id, inventoryItemId]
        );
      }

      // 3. Check if inventory_level already exists for this item+location (may be soft-deleted)
      const { rows: existingLevel } = await client.query(
        `SELECT id FROM inventory_level
         WHERE inventory_item_id = $1 AND location_id = $2
         LIMIT 1`,
        [inventoryItemId, STOCK_LOCATION_ID]
      );

      if (existingLevel.length > 0) {
        // Update existing level (restore if soft-deleted)
        await client.query(
          `UPDATE inventory_level
           SET stocked_quantity = $1, deleted_at = NULL, updated_at = NOW()
           WHERE id = $2`,
          [DEFAULT_QUANTITY, existingLevel[0].id]
        );
        updated++;
      } else {
        // Insert brand new level
        await client.query(
          `INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())`,
          [genId('ilev'), inventoryItemId, STOCK_LOCATION_ID, DEFAULT_QUANTITY]
        );
        created++;
      }

      const total = created + updated;
      if (total % BATCH === 0 || i === variants.length - 1) {
        process.stdout.write(`\r  Progress: ${i + 1}/${variants.length} | Created: ${created} | Updated: ${updated} | Errors: ${errors}`);
      }
    } catch (err) {
      errors++;
      console.error(`\n  ❌ Error for variant ${variant.variant_id}: ${err.message}`);
    }
  }

  console.log(`\n\n✅ Done!`);
  console.log(`  Created new inventory items+levels: ${created}`);
  console.log(`  Updated existing levels: ${updated}`);
  console.log(`  Errors: ${errors}`);

  // Final verification
  const { rows: check } = await client.query(`
    SELECT COUNT(*) as variants_missing
    FROM product_variant pv
    WHERE pv.deleted_at IS NULL
      AND pv.id NOT IN (
        SELECT pvii.variant_id
        FROM product_variant_inventory_item pvii
        JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
        WHERE il.location_id = $1
          AND il.deleted_at IS NULL
          AND pvii.deleted_at IS NULL
      )
  `, [STOCK_LOCATION_ID]);

  console.log(`\n📊 Verification: ${check[0].variants_missing} variants still missing inventory levels`);

  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
