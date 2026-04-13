/**
 * fix-missing-prices.js
 * Fixes all product variants that have NO price set in Medusa.
 * Fetches prices from Odoo using variant SKUs and inserts them into the DB.
 *
 * Run on VPS: node fix-missing-prices.js
 */

const { Client } = require('pg');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const DB_URL    = process.env.DATABASE_URL || 'postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa';
const ODOO_URL  = process.env.ODOO_URL     || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB   = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_PASS = process.env.ODOO_PASSWORD || 'S123456';
const CURRENCY  = 'kwd';

// ── Helpers ───────────────────────────────────────────────────────────────────
function genId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = prefix + '_';
  for (let i = 0; i < 26; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function odooRequest(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params });
    const url = new URL(`${ODOO_URL}${method}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function odooAuthenticate() {
  const res = await odooRequest('/web/dataset/call_kw', {
    model: 'res.users',
    method: 'authenticate',
    args: [ODOO_DB, ODOO_USER, ODOO_PASS, {}],
    kwargs: {},
  });
  // Try standard login if above fails
  if (!res.result) {
    const loginRes = await odooRequest('/web/session/authenticate', {
      db: ODOO_DB, login: ODOO_USER, password: ODOO_PASS,
    });
    if (loginRes.result?.uid) return loginRes.result.uid;
    throw new Error('Odoo auth failed: ' + JSON.stringify(res));
  }
  return res.result;
}

async function fetchOdooPricesBySku(uid, skus) {
  // Fetch in batches of 200
  const results = {};
  const batchSize = 200;
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);
    const res = await odooRequest('/web/dataset/call_kw', {
      model: 'product.product',
      method: 'search_read',
      args: [[['default_code', 'in', batch]]],
      kwargs: {
        fields: ['default_code', 'list_price', 'currency_id'],
        limit: batchSize,
        context: { uid },
      },
    });
    if (res.result) {
      for (const p of res.result) {
        if (p.default_code && p.list_price > 0) {
          results[p.default_code.trim()] = p.list_price;
        }
      }
    }
    process.stdout.write(`  Fetched Odoo prices: ${Object.keys(results).length} found (batch ${Math.floor(i/batchSize)+1})\r`);
  }
  console.log();
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();
  console.log('✅ Connected to DB');

  // 1. Get all variants with NO price
  const { rows: missingVariants } = await pg.query(`
    SELECT pv.id, pv.sku, pv.title, p.title as product_title
    FROM product_variant pv
    JOIN product p ON pv.product_id = p.id
    WHERE pv.id NOT IN (SELECT variant_id FROM product_variant_price_set)
      AND pv.deleted_at IS NULL
    ORDER BY p.title
  `);
  console.log(`📦 Found ${missingVariants.length} variants with no price`);

  if (missingVariants.length === 0) {
    console.log('✅ All variants have prices!');
    await pg.end();
    return;
  }

  // 2. Authenticate with Odoo
  console.log('🔐 Authenticating with Odoo...');
  let uid;
  try {
    uid = await odooAuthenticate();
    console.log(`✅ Odoo UID: ${uid}`);
  } catch (e) {
    console.error('❌ Odoo auth failed:', e.message);
    // Fallback: set a default price for all missing variants
    console.log('⚠️  Using fallback: setting price to 0.001 KWD for all missing variants');
    uid = null;
  }

  // 3. Fetch prices from Odoo
  const skus = missingVariants.map(v => v.sku).filter(Boolean);
  let odooPrices = {};
  if (uid && skus.length > 0) {
    console.log(`🔍 Fetching prices for ${skus.length} SKUs from Odoo...`);
    odooPrices = await fetchOdooPricesBySku(uid, skus);
    console.log(`✅ Got ${Object.keys(odooPrices).length} prices from Odoo`);
  }

  // 4. Insert prices
  let fixed = 0, skipped = 0, defaulted = 0;
  for (const variant of missingVariants) {
    const sku = variant.sku?.trim();
    let price = sku ? odooPrices[sku] : null;

    // If no Odoo price found, check if there's a price via product template
    if (!price && sku) {
      // Try alternate SKU lookups (trimmed, uppercase)
      price = odooPrices[sku.toUpperCase()] || odooPrices[sku.toLowerCase()];
    }

    // If still no price, use 0.001 as placeholder (non-zero so cart works)
    if (!price || price <= 0) {
      price = 0.001;
      defaulted++;
    }

    try {
      // Check if price_set already exists (race condition guard)
      const { rows: existing } = await pg.query(
        'SELECT price_set_id FROM product_variant_price_set WHERE variant_id = $1',
        [variant.id]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const priceSetId = genId('pset');
      const pvpsId = genId('pvps');
      const priceId = genId('price');
      const rawAmount = JSON.stringify({ value: String(price), precision: 20 });

      await pg.query(
        'INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, NOW(), NOW())',
        [priceSetId]
      );
      await pg.query(
        'INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [pvpsId, variant.id, priceSetId]
      );
      await pg.query(
        'INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())',
        [priceId, priceSetId, CURRENCY, price, rawAmount]
      );

      fixed++;
      if (fixed % 50 === 0) process.stdout.write(`  Fixed ${fixed}/${missingVariants.length} variants...\r`);
    } catch (err) {
      console.error(`  ❌ Error fixing variant ${variant.id} (${sku}):`, err.message);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Fixed:     ${fixed} variants (${fixed - defaulted} from Odoo, ${defaulted} with placeholder price)`);
  console.log(`   Skipped:   ${skipped} (already had price)`);

  // 5. Final count
  const { rows: finalCount } = await pg.query(`
    SELECT COUNT(*) as missing FROM product_variant
    WHERE id NOT IN (SELECT variant_id FROM product_variant_price_set)
    AND deleted_at IS NULL
  `);
  console.log(`   Remaining without price: ${finalCount[0].missing}`);

  await pg.end();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
