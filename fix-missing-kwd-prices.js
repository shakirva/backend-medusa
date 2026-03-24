/**
 * fix-missing-kwd-prices.js
 * Fixes all product variants that have NO KWD price in Medusa.
 * - For variants with existing price_set but no KWD price: adds KWD price
 * - For variants with no price_set at all: creates price_set + KWD price
 * Fetches real prices from Odoo via XML-RPC API key auth.
 *
 * Run on VPS: node fix-missing-kwd-prices.js
 */

const { Client } = require('pg');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const DB_URL    = process.env.DATABASE_URL || 'postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa';
const ODOO_URL  = process.env.ODOO_URL     || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB   = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_PASS = process.env.ODOO_PASSWORD || 'S123456';
const ODOO_API_KEY = process.env.ODOO_API_KEY || '5941b8e316918f7753a4b9845e0315aa072686d4';
const CURRENCY  = 'kwd';
const DEFAULT_PRICE = 1.000; // fallback if Odoo has no price

// ── Helpers ───────────────────────────────────────────────────────────────────
function genId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = prefix + '_';
  for (let i = 0; i < 26; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function jsonRpcCall(url, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: Date.now(), params });
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function odooAuth() {
  // Use API key authentication (Odoo 16+)
  const res = await jsonRpcCall(`${ODOO_URL}/web/session/authenticate`, {
    db: ODOO_DB,
    login: ODOO_USER,
    password: ODOO_API_KEY, // API key works as password
  });
  if (res.result?.uid) {
    console.log(`✅ Odoo authenticated (uid: ${res.result.uid})`);
    return res.result.uid;
  }
  // Fallback: try regular password
  const res2 = await jsonRpcCall(`${ODOO_URL}/web/session/authenticate`, {
    db: ODOO_DB, login: ODOO_USER, password: ODOO_PASS,
  });
  if (res2.result?.uid) {
    console.log(`✅ Odoo authenticated via password (uid: ${res2.result.uid})`);
    return res2.result.uid;
  }
  console.warn('⚠️  Odoo auth failed, will use default prices');
  return null;
}

async function fetchOdooPricesForSkus(uid, skus) {
  const prices = {};
  if (!uid || skus.length === 0) return prices;

  const batchSize = 500;
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize).filter(Boolean);
    if (batch.length === 0) continue;

    const res = await jsonRpcCall(`${ODOO_URL}/web/dataset/call_kw`, {
      model: 'product.product',
      method: 'search_read',
      args: [[['default_code', 'in', batch]]],
      kwargs: {
        fields: ['default_code', 'list_price'],
        limit: batchSize,
        context: {},
      },
    });

    if (res.result) {
      for (const p of res.result) {
        const sku = (p.default_code || '').trim();
        if (sku && p.list_price > 0) {
          prices[sku] = p.list_price;
        }
      }
    }
    process.stdout.write(`  Odoo prices fetched: ${Object.keys(prices).length} | batch ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(skus.length / batchSize)}\r`);
    await new Promise(r => setTimeout(r, 200)); // rate limit
  }
  console.log();
  return prices;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();
  console.log('✅ Connected to PostgreSQL');

  // 1. Find all variants missing KWD price
  const { rows: missingKwd } = await pg.query(`
    SELECT
      pv.id as variant_id,
      pv.sku,
      pvps.price_set_id,
      p.id as existing_kwd_price_id
    FROM product_variant pv
    LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
    LEFT JOIN price p ON p.price_set_id = pvps.price_set_id
      AND p.currency_code = 'kwd'
      AND p.deleted_at IS NULL
    WHERE pv.deleted_at IS NULL
      AND p.id IS NULL
    ORDER BY pv.id
  `);

  console.log(`\n📦 Variants missing KWD price: ${missingKwd.length}`);
  if (missingKwd.length === 0) {
    console.log('🎉 All variants already have KWD prices!');
    await pg.end();
    return;
  }

  // 2. Auth with Odoo
  const uid = await odooAuth();

  // 3. Fetch Odoo prices
  const skus = [...new Set(missingKwd.map(v => v.sku).filter(Boolean))];
  console.log(`🔍 Fetching prices for ${skus.length} unique SKUs from Odoo...`);
  const odooPrices = await fetchOdooPricesForSkus(uid, skus);
  console.log(`✅ Got ${Object.keys(odooPrices).length} prices from Odoo`);

  // 4. Process each variant
  let addedToExisting = 0, createdNew = 0, usedDefault = 0, errors = 0;

  // Deduplicate: one entry per variant_id
  const seen = new Set();
  const unique = missingKwd.filter(v => {
    if (seen.has(v.variant_id)) return false;
    seen.add(v.variant_id);
    return true;
  });

  for (let i = 0; i < unique.length; i++) {
    const row = unique[i];

    // Get price from Odoo or use default
    const sku = (row.sku || '').trim();
    let price = odooPrices[sku] || odooPrices[sku.toUpperCase()] || odooPrices[sku.toLowerCase()];
    if (!price || price <= 0) {
      price = DEFAULT_PRICE;
      usedDefault++;
    }

    const rawAmount = JSON.stringify({ value: String(price), precision: 20 });
    const priceId = genId('price');

    try {
      if (row.price_set_id) {
        // Variant already has a price_set — just add KWD price to it
        await pg.query(
          `INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [priceId, row.price_set_id, CURRENCY, price, rawAmount]
        );
        addedToExisting++;
      } else {
        // No price_set at all — create one
        const priceSetId = genId('pset');
        const pvpsId = genId('pvps');
        await pg.query(
          'INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, NOW(), NOW())',
          [priceSetId]
        );
        await pg.query(
          `INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT DO NOTHING`,
          [pvpsId, row.variant_id, priceSetId]
        );
        await pg.query(
          `INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())`,
          [priceId, priceSetId, CURRENCY, price, rawAmount]
        );
        createdNew++;
      }
    } catch (err) {
      console.error(`\n❌ Error on variant ${row.variant_id} (${sku}):`, err.message);
      errors++;
    }

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`  Progress: ${i + 1}/${unique.length} processed...\r`);
    }
  }

  // 5. Summary
  const { rows: final } = await pg.query(`
    SELECT COUNT(*) as missing
    FROM product_variant pv
    WHERE pv.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM product_variant_price_set pvps
        JOIN price p ON p.price_set_id = pvps.price_set_id
          AND p.currency_code = 'kwd' AND p.deleted_at IS NULL
        WHERE pvps.variant_id = pv.id
      )
  `);

  console.log(`\n\n🎉 DONE!`);
  console.log(`   Added KWD to existing price_sets: ${addedToExisting}`);
  console.log(`   Created new price_sets + KWD price: ${createdNew}`);
  console.log(`   Used default price (${DEFAULT_PRICE} KWD):     ${usedDefault}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Remaining variants without KWD price: ${final[0].missing}`);

  await pg.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
