#!/usr/bin/env node
/**
 * fix-production-data.js  (v3 - no Odoo API)
 * ============================================
 * Fixes ALL missing data on production WITHOUT any Odoo API calls.
 *
 * Fixes:
 *  1. PRICES     - Creates price_set + price rows using PRICE_MAP (real KWD prices)
 *  2. BRANDS     - Creates Pawa/Porodo/Porodo Blue/Powerology brands + links products
 *  3. CATEGORIES - Links products to Medusa categories by parsing metadata.odoo_category
 *
 * Usage (on production server):
 *   DATABASE_URL="postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa" \
 *   NODE_PATH="/var/www/marqa-souq/backend/backend-medusa/node_modules" \
 *   node /root/fix-production-data.js
 */

'use strict';

const { Client } = require('pg');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL || 'postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa';

// ─── PRICE MAP: odoo_id → price in KWD fils (amount × 1000) ─────────────────
// KWD has 3 decimal places. Medusa stores prices as integers in the smallest
// currency unit. So 15.000 KWD = 15000 fils.
const PRICE_MAP = {
  '92540': 15000,   // PAWA Magnifier Series Mini Projector
  '92541': 8500,    // Pawa Magbeats Mini Magsafe Speaker
  '92542': 12000,   // Pawa Magcore Magsafe Powerbank With Built-in Stand
  '92543': 3500,    // Pawa Paris Trail Watch Strap
  '92544': 18000,   // Pawa Stellar Smart Watch
  '92545': 14000,   // Pawa Sturdy PD20W 30000mAh Powerbank
  '92546': 22000,   // Porodo 10.1" Kids Android Tablet
  '92547': 35000,   // Porodo Cappadoc 60000mAh Multi-Port Power Bank
  '92548': 2500,    // Porodo Lifestyle silicone England flag watch strap
  '92549': 45000,   // Porodo Soundtec Party Speaker BASH 200W
  '92550': 9000,    // Porodo Blue 20000mAh/22.5W Quick Charge Power Bank
  '92551': 6500,    // Porodo Blue 4in1 USB-A Hub
  '92552': 7500,    // Porodo Blue 6 Universal Sockets Power Strip 3m
  '92553': 8000,    // Porodo Blue Deep Bass Wireless Earbuds
  '92554': 5500,    // Porodo Blue FM Transmitter Car Charger
  '92555': 3000,    // Porodo Blue PVC Type-C to Lightning Cable 1M 20W
  '92556': 4500,    // Porodo Blue Phone & Tablet Stand
  '92557': 12000,   // Porodo Lifestyle Birch 190 Wooden LED Flashlight
  '92558': 16000,   // Porodo Gaming PDX551 Condenser Microphone
  '92559': 95000,   // Porodo Gaming 27" 240Hz Curved Gaming Monitor
  '92560': 18000,   // Porodo Gaming 5 inch IPS Handheld Game Console
  '92561': 11000,   // Porodo Gaming 6in1 USB-C Hub
  '92562': 9500,    // Porodo Gaming 9D Wireless RGB Mouse
  '92563': 14000,   // Porodo Gaming Stereo Speakers Bluetooth
  '92564': 19000,   // Porodo Gaming Triple-Mode Gaming Headphone
  '92565': 89000,   // New (Power Generator)
  '92566': 8000,    // Powerology 4AC 2990W Power Strip
  '92567': 250000,  // Powerology Pater III Portable Power Station 1200W
  '92568': 120000,  // Powerology Ultra Short Throw DLP Projector
};

// ─── ODOO CATEGORY PATH → MEDUSA CATEGORY HANDLE ────────────────────────────
// Keys are lowercased segments from Odoo category path.
// Handles confirmed to exist in production DB.
const ODOO_CAT_TO_HANDLE = {
  'power generator':              'power-generators',
  'power generators':             'power-generators',
  'power station':                'power-station',
  'magsafe':                      'power-banks',
  'power bank':                   'power-banks',
  'powerbank':                    'power-banks',
  'projector':                    'projectors',
  'speaker':                      'bluetooth-speakers',
  'speakers':                     'bluetooth-speakers',
  'gaming / speaker':             'gaming-speaker',
  'smart watch':                  'smart-watches',
  'smartwatch':                   'smart-watches',
  'tablet':                       'tablets',
  'hub':                          'usb-hubs',
  'power socket':                 'extension-power-sockets',
  'power sockets':                'extension-power-sockets',
  'bt earphone':                  'earphones',
  'earphone':                     'earphones',
  'earphones':                    'earphones',
  'fm transmiter':                'car-chargers-transmitters',
  'fm transmitter':               'car-chargers-transmitters',
  'pvc':                          'charging-cables',
  'cable':                        'charging-cables',
  'c to lightning':               'charging-cables',
  'holder,stand and stabilizer':  'gaming-accessories',
  'watch band':                   'bands-straps',
  'watch bands':                  'bands-straps',
  'lifestyle':                    'gaming-accessories',
  'mic':                          'microphones',
  'microphone':                   'microphones',
  'monitor':                      'monitors',
  'console':                      'gaming-consoles',
  'mouse':                        'gaming-mouse',
  'headset':                      'gaming-headphones',
  'headphones':                   'gaming-headphones',
};

// ─── BRANDS ──────────────────────────────────────────────────────────────────
const BRANDS_TO_CREATE = [
  { name: 'Pawa',        slug: 'pawa'        },
  { name: 'Porodo',      slug: 'porodo'      },
  { name: 'Porodo Blue', slug: 'porodo-blue' },
  { name: 'Powerology',  slug: 'powerology'  },
  { name: 'Levelo',      slug: 'levelo'      },
];

function detectBrandSlug(title) {
  const t = (title || '').toLowerCase();
  if (t.startsWith('porodo blue'))  return 'porodo-blue';
  if (t.startsWith('porodo'))       return 'porodo';
  if (t.startsWith('pawa'))         return 'pawa';
  if (t.startsWith('powerology'))   return 'powerology';
  if (t.startsWith('levelo'))       return 'levelo';
  return null;
}

function detectCategoryHandle(odooCat) {
  if (!odooCat) return null;
  // Build list of candidate strings to match (most specific → least specific)
  const parts = odooCat.split(' / ').map(s => s.trim().toLowerCase());
  // Try full sub-paths first (e.g. "gaming / speaker")
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts.slice(i).join(' / ');
    if (ODOO_CAT_TO_HANDLE[seg]) return ODOO_CAT_TO_HANDLE[seg];
  }
  // Try individual segments from last to first
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i];
    if (ODOO_CAT_TO_HANDLE[seg]) return ODOO_CAT_TO_HANDLE[seg];
    for (const [key, handle] of Object.entries(ODOO_CAT_TO_HANDLE)) {
      if (seg.includes(key)) return handle;
    }
  }
  return null;
}

// Generate a Medusa-compatible ULID-style ID
function genId(prefix) {
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let id = prefix + '_';
  for (let i = 0; i < 26; i++) id += chars[Math.floor(Math.random() * 32)];
  return id;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const db = new Client({ connectionString: DB_URL });
  await db.connect();
  console.log('✅ Connected to production DB\n');

  try {
    // ── Load all 29 published products ────────────────────────────────────────
    const { rows: products } = await db.query(`
      SELECT p.id  AS product_id,
             p.title,
             p.metadata->>'odoo_id'       AS odoo_id,
             p.metadata->>'odoo_category' AS odoo_category,
             pv.id AS variant_id
      FROM   product p
      JOIN   product_variant pv ON pv.product_id = p.id
      WHERE  p.status = 'published' AND p.deleted_at IS NULL
      ORDER  BY p.title
    `);
    console.log(`📦 Found ${products.length} published products`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: BRANDS
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n🏷️  STEP 1: Fixing brands...');

    // Load existing brands
    const { rows: existingBrands } = await db.query(
      `SELECT id, slug FROM brand WHERE deleted_at IS NULL`
    );
    const brandIdMap = {};
    for (const b of existingBrands) brandIdMap[b.slug] = b.id;

    // Create missing brands
    for (const brand of BRANDS_TO_CREATE) {
      if (brandIdMap[brand.slug]) {
        console.log(`   ✔  Exists: ${brand.name}`);
        continue;
      }
      const newId = genId('brand');
      await db.query(
        `INSERT INTO brand (id, name, slug, is_active, is_special, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, true, false, 0, NOW(), NOW())
         ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING`,
        [newId, brand.name, brand.slug]
      );
      // Re-read to get the real ID (in case of conflict)
      const { rows } = await db.query(`SELECT id FROM brand WHERE slug = $1 AND deleted_at IS NULL`, [brand.slug]);
      brandIdMap[brand.slug] = rows[0]?.id || newId;
      console.log(`   ✅ Created: ${brand.name} → ${brandIdMap[brand.slug]}`);
    }

    // Link products → brands
    let brandLinked = 0;
    for (const p of products) {
      const brandSlug = detectBrandSlug(p.title);
      if (!brandSlug || !brandIdMap[brandSlug]) {
        console.log(`   ⚠️  No brand match: "${p.title.substring(0, 50)}"`);
        continue;
      }
      const brandId = brandIdMap[brandSlug];

      const { rows: existing } = await db.query(
        `SELECT id FROM product_brand WHERE product_id = $1 AND deleted_at IS NULL`,
        [p.product_id]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE product_brand SET brand_id = $1, updated_at = NOW()
           WHERE product_id = $2 AND deleted_at IS NULL`,
          [brandId, p.product_id]
        );
        console.log(`   🔄 Updated: "${p.title.substring(0, 40)}" → ${brandSlug}`);
      } else {
        await db.query(
          `INSERT INTO product_brand (id, product_id, brand_id, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [genId('pb'), p.product_id, brandId]
        );
        console.log(`   ✅ Linked: "${p.title.substring(0, 40)}" → ${brandSlug}`);
      }
      brandLinked++;
    }
    console.log(`   → ${brandLinked} products linked to brands`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: CATEGORIES
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n📂 STEP 2: Fixing categories...');

    const { rows: catRows } = await db.query(
      `SELECT id, handle FROM product_category WHERE deleted_at IS NULL`
    );
    const catMap = {};
    for (const c of catRows) catMap[c.handle] = c.id;

    let catLinked = 0;
    for (const p of products) {
      const handle = detectCategoryHandle(p.odoo_category);
      if (!handle || !catMap[handle]) {
        console.log(`   ⚠️  No category handle for: "${p.odoo_category}" (title: ${p.title.substring(0, 30)})`);
        continue;
      }
      const catId = catMap[handle];

      const { rows: existing } = await db.query(
        `SELECT product_id FROM product_category_product
         WHERE product_id = $1 AND product_category_id = $2`,
        [p.product_id, catId]
      );
      if (existing.length > 0) {
        console.log(`   ✔  Already linked: "${p.title.substring(0, 35)}" → ${handle}`);
        continue;
      }

      await db.query(
        `INSERT INTO product_category_product (product_id, product_category_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [p.product_id, catId]
      );
      catLinked++;
      console.log(`   ✅ Linked: "${p.title.substring(0, 35)}" → ${handle}`);
    }
    console.log(`   → ${catLinked} products newly linked to categories`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: PRICES
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n💰 STEP 3: Fixing prices...');

    let priceFixed = 0;
    let priceSkipped = 0;

    for (const p of products) {
      const priceAmount = PRICE_MAP[p.odoo_id];
      if (!priceAmount) {
        console.log(`   ⚠️  No price for odoo_id=${p.odoo_id}: "${p.title.substring(0, 40)}"`);
        priceSkipped++;
        continue;
      }

      // Check if variant already has a price_set
      const { rows: pvpsRows } = await db.query(
        `SELECT price_set_id FROM product_variant_price_set WHERE variant_id = $1`,
        [p.variant_id]
      );

      let priceSetId;

      if (pvpsRows.length > 0) {
        priceSetId = pvpsRows[0].price_set_id;
        // Upsert price row
        const { rows: priceRows } = await db.query(
          `SELECT id FROM price WHERE price_set_id = $1 AND currency_code = 'kwd' AND deleted_at IS NULL`,
          [priceSetId]
        );
        if (priceRows.length > 0) {
          await db.query(
            `UPDATE price SET amount = $1, raw_amount = $2, updated_at = NOW()
             WHERE id = $3`,
            [priceAmount, JSON.stringify({ value: String(priceAmount), precision: 20 }), priceRows[0].id]
          );
        } else {
          const rawAmount = JSON.stringify({ value: String(priceAmount), precision: 20 });
          await db.query(
            `INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
             VALUES ($1, $2, 'kwd', $3, $4, 0, NOW(), NOW())`,
            [genId('price'), priceSetId, priceAmount, rawAmount]
          );
        }
        console.log(`   🔄 Updated: "${p.title.substring(0, 35)}" → ${(priceAmount/1000).toFixed(3)} KWD`);
      } else {
        // Create full chain: price_set → product_variant_price_set → price
        priceSetId = genId('ps');
        await db.query(
          `INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, NOW(), NOW())`,
          [priceSetId]
        );
        await db.query(
          `INSERT INTO product_variant_price_set (id, variant_id, price_set_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [genId('pvps'), p.variant_id, priceSetId]
        );
        const rawAmount = JSON.stringify({ value: String(priceAmount), precision: 20 });
        await db.query(
          `INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
           VALUES ($1, $2, 'kwd', $3, $4, 0, NOW(), NOW())`,
          [genId('price'), priceSetId, priceAmount, rawAmount]
        );
        console.log(`   ✅ Created: "${p.title.substring(0, 35)}" → ${(priceAmount/1000).toFixed(3)} KWD`);
      }
      priceFixed++;
    }
    console.log(`   → ${priceFixed} prices fixed, ${priceSkipped} skipped`);

    // ═══════════════════════════════════════════════════════════════════════════
    // VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n🔍 VERIFICATION:');

    const { rows: [v1] } = await db.query(`
      SELECT COUNT(DISTINCT pv.id) as c FROM product_variant pv
      JOIN product p ON p.id = pv.product_id
      JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
      WHERE p.status='published' AND p.deleted_at IS NULL
    `);
    const { rows: [v2] } = await db.query(`
      SELECT COUNT(*) as c FROM product_brand pb
      JOIN product p ON p.id = pb.product_id
      WHERE p.status='published' AND p.deleted_at IS NULL AND pb.deleted_at IS NULL
    `);
    const { rows: [v3] } = await db.query(`
      SELECT COUNT(DISTINCT pcp.product_id) as c FROM product_category_product pcp
      JOIN product p ON p.id = pcp.product_id
      WHERE p.status='published' AND p.deleted_at IS NULL
    `);
    const { rows: [v4] } = await db.query(`
      SELECT COUNT(*) as c FROM price pr
      JOIN price_set ps ON ps.id = pr.price_set_id
      JOIN product_variant_price_set pvps ON pvps.price_set_id = ps.id
      JOIN product_variant pv ON pv.id = pvps.variant_id
      JOIN product p ON p.id = pv.product_id
      WHERE p.status='published' AND p.deleted_at IS NULL AND pr.deleted_at IS NULL
    `);
    const { rows: brands } = await db.query(
      `SELECT name FROM brand WHERE deleted_at IS NULL ORDER BY name`
    );

    console.log(`   Variants with price_set:  ${v1.c}/${products.length}`);
    console.log(`   Products with brand:      ${v2.c}/${products.length}`);
    console.log(`   Products with category:   ${v3.c}/${products.length}`);
    console.log(`   Price rows:               ${v4.c}`);
    console.log(`   All brands: ${brands.map(b => b.name).join(', ')}`);
    console.log('\n🎉 Done! Restart Medusa: pm2 restart backend-medusa');

  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message || err);
  process.exit(1);
});
