#!/usr/bin/env node
/**
 * Sync Brand Images from Odoo
 * 
 * Fetches brand logos from Odoo's custom.product.brand model
 * and saves them to the frontend public/brands/ directory,
 * then updates the brand DB records with the correct logo_url.
 * 
 * Run: node scripts/sync-brand-images.js
 */

const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ── Config ──
const ODOO_URL = process.env.ODOO_URL || 'https://oskarllc-new-31031096.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB_NAME || 'oskarllc-new-31031096';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_PASS = process.env.ODOO_API_KEY || '2a420f7cb6d0c1c8f73368131f025f638c30704e';

const IS_PROD = fs.existsSync('/var/www/marqa-souq/frontend/markasouq-web/public/brands');
const OUT_DIR = IS_PROD
  ? '/var/www/marqa-souq/frontend/markasouq-web/public/brands'
  : path.join(__dirname, '..', 'frontend', 'markasouq-web', 'public', 'brands');

// PostgreSQL — read from .env
const dotenvPath = IS_PROD
  ? '/var/www/marqa-souq/backend/backend-medusa/.env'
  : path.join(__dirname, '..', '.env');

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf8');
  const match = envContent.match(/DATABASE_URL\s*=\s*"?([^\s"]+)"?/);
  if (match) DATABASE_URL = match[1];
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

// ── Odoo JSON-RPC helpers ──
const client = axios.create({
  baseURL: ODOO_URL,
  headers: { 'Content-Type': 'application/json' },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 120000,
});

let requestId = 0;
let uid = null;

async function jsonRpc(url, method, params) {
  const res = await client.post(url, {
    jsonrpc: '2.0',
    method,
    params,
    id: ++requestId,
  });
  if (res.data.error) {
    throw new Error(`Odoo Error: ${res.data.error.message || res.data.error.data?.message}`);
  }
  return res.data.result;
}

async function authenticate() {
  uid = await jsonRpc('/jsonrpc', 'call', {
    service: 'common',
    method: 'authenticate',
    args: [ODOO_DB, ODOO_USER, ODOO_PASS, {}],
  });
  if (!uid || typeof uid !== 'number') {
    throw new Error('Odoo authentication failed');
  }
  console.log('✅ Odoo authenticated, UID:', uid);
}

async function searchRead(model, domain, fields, limit = 500) {
  return jsonRpc('/jsonrpc', 'call', {
    service: 'object',
    method: 'execute_kw',
    args: [ODOO_DB, uid, ODOO_PASS, model, 'search_read', [domain], { fields, limit }],
  });
}

// ── Main ──
async function main() {
  console.log('🔄 Syncing brand images from Odoo...');
  console.log(`   Output dir: ${OUT_DIR}`);

  // Ensure output directory
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. Authenticate with Odoo
  await authenticate();

  // 2. Fetch all brands with image_1920
  let brands = [];
  try {
    brands = await searchRead('custom.product.brand', [], ['id', 'name', 'image_1920'], 500);
    console.log(`📦 Found ${brands.length} brands in Odoo (custom.product.brand)`);
  } catch (e) {
    console.warn('⚠️  custom.product.brand not available, trying product.brand...');
    try {
      brands = await searchRead('product.brand', [], ['id', 'name', 'image_1920'], 500);
      console.log(`📦 Found ${brands.length} brands in Odoo (product.brand)`);
    } catch (e2) {
      console.error('❌ Neither custom.product.brand nor product.brand model found:', e2.message);
      return;
    }
  }

  if (!brands.length) {
    console.log('No brands found in Odoo.');
    return;
  }

  // 3. Connect to PostgreSQL
  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();
  console.log('✅ Connected to PostgreSQL');

  let synced = 0;
  let skipped = 0;
  let noImage = 0;

  for (const odooBrand of brands) {
    const name = (odooBrand.name || '').trim();
    if (!name) continue;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const img = odooBrand.image_1920;

    // Check if brand exists in Medusa DB
    const existing = await pg.query(
      'SELECT id, logo_url FROM brand WHERE LOWER(name) = $1',
      [name.toLowerCase()]
    );

    if (existing.rows.length === 0) {
      console.log(`   ⏭  "${name}" not found in Medusa DB, skipping`);
      skipped++;
      continue;
    }

    const brandId = existing.rows[0].id;
    const currentLogo = existing.rows[0].logo_url;

    // Skip if brand already has a good logo (SVG or existing file)
    if (currentLogo) {
      const logoPath = currentLogo.startsWith('/brands/')
        ? path.join(OUT_DIR, currentLogo.replace('/brands/', ''))
        : null;
      if (logoPath && fs.existsSync(logoPath)) {
        console.log(`   ✓  "${name}" already has logo: ${currentLogo}`);
        skipped++;
        continue;
      }
    }

    // Process image from Odoo
    if (!img || img === true || (typeof img === 'string' && img.length < 200)) {
      console.log(`   ⚠  "${name}" has no image in Odoo`);
      noImage++;
      continue;
    }

    // Save base64 image to disk
    const fname = `${slug}-brand.png`;
    const fpath = path.join(OUT_DIR, fname);

    try {
      fs.writeFileSync(fpath, Buffer.from(img, 'base64'));
      const logoUrl = `/brands/${fname}`;

      // Update the DB
      await pg.query('UPDATE brand SET logo_url = $1, updated_at = NOW() WHERE id = $2', [
        logoUrl,
        brandId,
      ]);

      console.log(`   ✅ "${name}" → ${logoUrl} (${(Buffer.from(img, 'base64').length / 1024).toFixed(1)}KB)`);
      synced++;
    } catch (e) {
      console.error(`   ❌ Failed to save image for "${name}":`, e.message);
    }
  }

  await pg.end();
  console.log(`\n🎉 Done! Synced: ${synced}, Skipped: ${skipped}, No image: ${noImage}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
