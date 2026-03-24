/**
 * update-odoo-prices.js
 * Updates all KWD prices in Medusa with real prices from Odoo.
 * Uses /jsonrpc (XML-RPC over JSON) - same auth method as the backend service.
 *
 * Run on VPS: node update-odoo-prices.js
 */

const { Client } = require('pg');
const https = require('https');

const DB_URL    = process.env.DATABASE_URL || 'postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa';
const ODOO_URL  = process.env.ODOO_URL     || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB   = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_PASS = process.env.ODOO_PASSWORD || 'S123456';

function jsonrpc(path, service, method, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: Date.now(), params: { service, method, args } });
    const u = new URL(ODOO_URL + path);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).result); } catch (e) { reject(new Error('Parse error: ' + d.substring(0, 100))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Auth via /jsonrpc (same as backend service)
  console.log('🔐 Authenticating with Odoo via /jsonrpc...');
  const uid = await jsonrpc('/jsonrpc', 'common', 'authenticate', [ODOO_DB, ODOO_USER, ODOO_PASS, {}]);
  if (!uid || typeof uid !== 'number') {
    console.error('❌ Auth failed:', uid);
    process.exit(1);
  }
  console.log('✅ Odoo UID:', uid);

  // 2. Connect to DB
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();
  console.log('✅ DB connected');

  // 3. Get all active variants with SKUs
  const { rows } = await pg.query(`
    SELECT pv.id as variant_id, pv.sku, p.id as price_id, p.amount as current_price
    FROM product_variant pv
    JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
    JOIN price p ON p.price_set_id = pvps.price_set_id
      AND p.currency_code = 'kwd' AND p.deleted_at IS NULL
    WHERE pv.deleted_at IS NULL
      AND pv.sku IS NOT NULL AND pv.sku != ''
    ORDER BY pv.sku
  `);
  console.log('📦 Variants with KWD price:', rows.length);

  // 4. Fetch all Odoo prices in batches of 500
  const skus = [...new Set(rows.map(r => r.sku.trim()).filter(Boolean))];
  console.log('🔍 Fetching prices for', skus.length, 'unique SKUs from Odoo...');

  const odooPrices = {};
  const batchSize = 500;
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);
    const result = await jsonrpc('/jsonrpc', 'object', 'execute_kw', [
      ODOO_DB, uid, ODOO_PASS,
      'product.product', 'search_read',
      [[['default_code', 'in', batch]]],
      { fields: ['default_code', 'list_price'], limit: batchSize },
    ]);
    if (Array.isArray(result)) {
      for (const p of result) {
        const sku = (p.default_code || '').trim();
        if (sku && p.list_price > 0) {
          odooPrices[sku] = p.list_price;
        }
      }
    }
    process.stdout.write(`  Fetched ${Object.keys(odooPrices).length} Odoo prices...\r`);
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n✅ Odoo prices fetched: ${Object.keys(odooPrices).length}`);

  // 5. Update KWD prices with real values
  let updated = 0, skipped = 0;
  for (const row of rows) {
    const sku = (row.sku || '').trim();
    const price = odooPrices[sku] || odooPrices[sku.toUpperCase()] || odooPrices[sku.toLowerCase()];

    if (!price || price <= 0) {
      skipped++;
      continue;
    }

    // Only update if price has changed
    if (Math.abs(parseFloat(row.current_price) - price) < 0.0001) {
      skipped++;
      continue;
    }

    const rawAmount = JSON.stringify({ value: String(price), precision: 20 });
    await pg.query(
      'UPDATE price SET amount = $1, raw_amount = $2, updated_at = NOW() WHERE id = $3',
      [price, rawAmount, row.price_id]
    );
    updated++;
    if (updated % 100 === 0) process.stdout.write(`  Updated ${updated} prices...\r`);
  }

  console.log(`\n\n🎉 Done!`);
  console.log(`   Updated: ${updated} prices with real Odoo values`);
  console.log(`   Skipped: ${skipped} (no Odoo price found or unchanged)`);

  await pg.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
