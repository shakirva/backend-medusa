const https = require('https');
const { Pool } = require('pg');

const ODOO_CONFIG = {
  url: 'https://oskarllc-new-27289548.dev.odoo.com',
  db: 'oskarllc-new-27289548',
  username: 'SYG',
  password: 'S123456',
};

async function odooJsonRpc(params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: '2.0', method: 'call', params, id: Date.now() });
    const url = new URL(ODOO_CONFIG.url);
    const options = {
      hostname: url.hostname, port: 443, path: '/jsonrpc', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body).result); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function syncMissingProducts() {
  console.log('🔄 Syncing missing Odoo products...\n');
  
  const pool = new Pool({ connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev' });
  
  // Authenticate
  const uid = await odooJsonRpc({
    service: 'common', method: 'authenticate',
    args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}]
  });
  console.log('✅ Authenticated with Odoo, UID:', uid);
  
  // Get ALL Odoo products
  const odooProducts = await odooJsonRpc({
    service: 'object', method: 'execute_kw',
    args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, 'product.product', 'search_read',
      [[['sale_ok', '=', true]]],
      { fields: ['id', 'name', 'default_code', 'list_price', 'barcode', 'categ_id', 'qty_available', 'image_1920'], limit: 1000 }
    ]
  });
  console.log('📦 Odoo products:', odooProducts.length);
  
  // Get synced odoo_ids from MedusaJS
  const medusaProducts = await pool.query("SELECT metadata->>'odoo_id' as odoo_id FROM product WHERE metadata->>'odoo_id' IS NOT NULL");
  const syncedIds = new Set(medusaProducts.rows.map(p => parseInt(p.odoo_id)));
  console.log('📦 Already synced:', syncedIds.size);
  
  // Find missing products
  const missing = odooProducts.filter(p => !syncedIds.has(p.id));
  console.log('📦 Missing products:', missing.length);
  
  if (missing.length === 0) {
    console.log('\n✅ All products are already synced!');
    await pool.end();
    return;
  }
  
  // Get sales channel
  const sc = await pool.query('SELECT id FROM sales_channel LIMIT 1');
  const salesChannelId = sc.rows[0]?.id;
  
  // Get existing handles to avoid duplicates
  const handles = await pool.query('SELECT handle FROM product');
  const existingHandles = new Set(handles.rows.map(p => p.handle));
  
  let imported = 0;
  
  for (const product of missing) {
    let handle = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    
    // Make handle unique if it exists
    let uniqueHandle = handle;
    let counter = 1;
    while (existingHandles.has(uniqueHandle)) {
      uniqueHandle = handle + '-' + counter;
      counter++;
    }
    handle = uniqueHandle;
    
    const sku = product.default_code || 'ODOO-' + product.id;
    
    try {
      const productId = 'prod_' + Date.now() + Math.random().toString(36).substr(2, 9);
      
      // Create product
      await pool.query(
        `INSERT INTO product (id, title, handle, status, metadata, created_at, updated_at) 
         VALUES ($1, $2, $3, 'published', $4, NOW(), NOW())`,
        [productId, product.name, handle, JSON.stringify({ 
          odoo_id: product.id, 
          odoo_sku: sku, 
          odoo_category: product.categ_id ? product.categ_id[1] : null 
        })]
      );
      
      // Create variant
      const variantId = 'variant_' + Date.now() + Math.random().toString(36).substr(2, 9);
      await pool.query(
        `INSERT INTO product_variant (id, product_id, title, sku, metadata, created_at, updated_at) 
         VALUES ($1, $2, 'Default', $3, $4, NOW(), NOW())`,
        [variantId, productId, sku, JSON.stringify({ odoo_id: product.id })]
      );
      
      // Add to sales channel
      if (salesChannelId) {
        await pool.query(
          'INSERT INTO product_sales_channel (product_id, sales_channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [productId, salesChannelId]
        );
      }
      
      // Add image if exists
      if (product.image_1920) {
        const imageUrl = ODOO_CONFIG.url + '/web/image/product.product/' + product.id + '/image_1920';
        await pool.query(
          `INSERT INTO product_image (id, product_id, url, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW())`,
          ['img_' + Date.now() + Math.random().toString(36).substr(2, 9), productId, imageUrl]
        );
      }
      
      existingHandles.add(handle);
      imported++;
      console.log('  ✅', product.name.substring(0, 50));
    } catch (e) {
      console.log('  ❌', product.name.substring(0, 50), '-', e.message);
    }
  }
  
  // Final count
  const finalCount = await pool.query('SELECT COUNT(*) FROM product');
  
  await pool.end();
  
  console.log('\n========================================');
  console.log('✅ Sync completed!');
  console.log('   Imported:', imported);
  console.log('   Total products now:', finalCount.rows[0].count);
  console.log('========================================');
}

syncMissingProducts().catch(console.error);
