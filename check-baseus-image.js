const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

const ODOO_URL = process.env.ODOO_URL || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_KEY = process.env.ODOO_API_KEY || '';

async function run() {
  try {
    console.log('🔎 Searching Odoo for product: Baseus Encock Headphone Holder DB01');
    // Authenticate
    const auth = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', params: { service: 'common', method: 'authenticate', args: [ODOO_DB, ODOO_USER, ODOO_KEY, {}] }, id: 1
    });
    const uid = auth.data.result;
    console.log('Authenticated UID:', uid);
    if (!uid) return console.log('Authentication failed');

    // Search product.product by name ilike
    const domain = [[['name', 'ilike', 'Baseus Encock Headphone Holder DB01']]]; // wrapper
    const search = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', params: { service: 'object', method: 'execute_kw', args: [ODOO_DB, uid, ODOO_KEY, 'product.product', 'search_read', [[['name', 'ilike', 'Baseus Encock Headphone Holder DB01']]], { fields: ['id','name','image_1920','product_tmpl_id','write_date'] } ] }, id: 2
    });

    const results = search.data.result || [];
    if (results.length === 0) {
      console.log('No products found with that exact name. Trying partial match "Baseus Encock"');
      const search2 = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0', method: 'call', params: { service: 'object', method: 'execute_kw', args: [ODOO_DB, uid, ODOO_KEY, 'product.product', 'search_read', [[['name', 'ilike', 'Baseus Encock']]], { fields: ['id','name','image_1920','product_tmpl_id','write_date'], limit: 20 } ] }, id: 3
      });
      const res2 = search2.data.result || [];
      if (res2.length === 0) {
        console.log('No products found with partial match either.');
        return;
      }
      console.log(`Found ${res2.length} products with "Baseus Encock"; listing first 5:`);
      for (let i=0;i<Math.min(5,res2.length);i++) {
        const p = res2[i];
        console.log(`${i+1}. ${p.name} (ID: ${p.id}) - has image: ${!!p.image_1920}`);
      }
      // pick first
      if (res2.length>0) {
        await checkImageAndMedusa(res2[0].id);
      }
      return;
    }

    console.log('Found products:', results.length);
    for (const p of results) {
      console.log(`- ${p.name} (ID: ${p.id}) - has image: ${!!p.image_1920}`);
    }
    // Check first match
    const first = results[0];
    await checkImageAndMedusa(first.id);

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.error('Response data:', err.response.data);
  }
}

async function checkImageAndMedusa(odooId) {
  try {
    const imageUrl = `${ODOO_URL}/web/image/product.product/${odooId}/image_1920`;
    console.log('\nChecking image URL:', imageUrl);
    try {
      const head = await axios.head(imageUrl);
      const len = head.headers['content-length'] || 'unknown';
      const ct = head.headers['content-type'] || 'unknown';
      console.log(`Image HEAD: content-type=${ct}, content-length=${len}`);
    } catch (herr) {
      console.log('HEAD failed, trying GET to inspect bytes');
      const get = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      console.log('GET returned bytes:', get.data.byteLength);
    }

    console.log('\nNow checking Medusa local DB for this Odoo ID');
    // Query Postgres for product with metadata->'odoo_id' = odooId
    const sql = `SELECT id, title, metadata->>'odoo_id' as odoo_id, thumbnail FROM product WHERE metadata->>'odoo_id' = '${odooId}' LIMIT 1;`;
    console.log('Running SQL:', sql);
    try {
      const out = execSync(`PGPASSWORD=marqa123 psql -h localhost -U marqa_user -d marqa_souq_dev -t -c "${sql.replace(/"/g,'\"')}"`, { encoding: 'utf8' });
      console.log('DB result (raw):\n', out.trim());
    } catch (dberr) {
      console.error('DB query failed:', dberr.message);
    }
  } catch (e) {
    console.error('Error in checkImageAndMedusa:', e.message);
  }
}

run();
