process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');
const { Client } = require('pg');

const ODOO_CONFIG = {
  url: 'https://oskarllc-new-27289548.dev.odoo.com',
  db: 'oskarllc-new-27289548',
  username: 'SYG',
  api_key: 'fa8410bdf3264b91ea393b9f8341626a98ca262a'
};

function jsonRpc(path, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: '2.0', method: 'call', params, id: Date.now() });
    const options = {
      hostname: new URL(ODOO_CONFIG.url).hostname,
      port: 443, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      rejectUnauthorized: false
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function gid(p) {
  const c = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let id = p + '_';
  for (let i = 0; i < 26; i++) id += c[Math.floor(Math.random() * c.length)];
  return id;
}

async function upsertProduct(client, product, imageUrl, brandName, isProduction) {
  const label = isProduction ? 'PRODUCTION' : 'LOCAL';
  const check = await client.query(`SELECT id, metadata FROM product WHERE metadata->>'odoo_id' = '92581' AND deleted_at IS NULL`);

  if (check.rows.length > 0) {
    const prodId = check.rows[0].id;
    const metadata = { ...(check.rows[0].metadata || {}), odoo_brand: brandName, odoo_image: imageUrl, synced_at: new Date().toISOString() };
    await client.query(
      `UPDATE product SET thumbnail=$1, subtitle=$2, metadata=$3, updated_at=NOW() WHERE id=$4`,
      [imageUrl, brandName, JSON.stringify(metadata), prodId]
    );
    // Update image table too
    await client.query(`UPDATE image SET url=$1, updated_at=NOW() WHERE product_id=$2 AND rank=0`, [imageUrl, prodId]);
    const imgCheck = await client.query(`SELECT id FROM image WHERE product_id=$1 AND rank=0`, [prodId]);
    if (imgCheck.rows.length === 0) {
      await client.query(`INSERT INTO image (id, url, rank, product_id, created_at, updated_at) VALUES ($1,$2,0,$3,NOW(),NOW())`, [gid('img'), imageUrl, prodId]);
    }
    console.log(`✅ ${label} - Updated product: ${prodId} | brand: ${brandName}`);
    return prodId;
  } else {
    // Insert new
    const scRes = await client.query(`SELECT id FROM sales_channel WHERE deleted_at IS NULL LIMIT 1`);
    const scId = scRes.rows[0]?.id;
    const metadata = { odoo_id: 92581, odoo_sku: 'APL20W-C', odoo_brand: brandName, odoo_category: 'All', odoo_qty: 0, synced_at: new Date().toISOString() };
    const productId = gid('prod');
    await client.query(
      `INSERT INTO product (id, title, handle, subtitle, description, thumbnail, status, metadata, discountable, is_giftcard, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,'published',$7,true,false,NOW(),NOW())`,
      [productId, 'Apple 20W USB-C Power Adapter', 'apple-20w-usb-c-power-adapter-92581', brandName,
       'Compact and efficient 20W USB-C power adapter for fast charging compatible Apple devices.',
       imageUrl, JSON.stringify(metadata)]
    );
    const variantId = gid('variant');
    await client.query(
      `INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, allow_backorder, variant_rank, created_at, updated_at) VALUES ($1,$2,'Default',$3,true,false,0,NOW(),NOW())`,
      [variantId, productId, 'APL20W-C']
    );
    const priceSetId = gid('pset');
    await client.query(`INSERT INTO price_set (id, created_at, updated_at) VALUES ($1,NOW(),NOW())`, [priceSetId]);
    await client.query(`INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())`, [gid('pvps'), variantId, priceSetId]);
    const rawAmount = JSON.stringify({ value: '14', precision: 20 });
    await client.query(`INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at) VALUES ($1,$2,'kwd',14,$3,0,NOW(),NOW())`, [gid('price'), priceSetId, rawAmount]);
    await client.query(`INSERT INTO image (id, url, rank, product_id, created_at, updated_at) VALUES ($1,$2,0,$3,NOW(),NOW())`, [gid('img'), imageUrl, productId]);
    if (scId) {
      await client.query(`INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW()) ON CONFLICT DO NOTHING`, [gid('psc'), productId, scId]);
    }
    console.log(`✅ ${label} - Created product: ${productId} | brand: ${brandName}`);
    return productId;
  }
}

async function main() {
  // 1. Fetch from Odoo
  const authRes = await jsonRpc('/jsonrpc', {
    service: 'common', method: 'authenticate',
    args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.api_key, {}]
  });
  const uid = authRes.result;
  console.log('Odoo UID:', uid);

  const res = await jsonRpc('/jsonrpc', {
    service: 'object', method: 'execute_kw',
    args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key,
      'product.template', 'read', [[92581]],
      { fields: ['id', 'name', 'brand_id', 'custom_brand_id', 'x_studio_brand_1', 'image_1920'] }
    ]
  });

  const product = res.result[0];
  const brandName = (Array.isArray(product.brand_id) && product.brand_id[1]) ||
                    (Array.isArray(product.custom_brand_id) && product.custom_brand_id[1]) ||
                    product.x_studio_brand_1 || 'Apple';
  const imageUrl = 'https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92581/image_1920';
  const hasOdooImage = !!product.image_1920;

  console.log('Brand resolved:', brandName);
  console.log('Has image in Odoo:', hasOdooImage);
  console.log('Image URL:', imageUrl);

  // 2. Update LOCAL DB
  const localClient = new Client({ host: 'localhost', port: 5432, database: 'marqa_souq_dev', user: 'marqa_user', password: 'marqa123' });
  await localClient.connect();
  await upsertProduct(localClient, product, imageUrl, brandName, false);
  await localClient.end();

  // 3. Update PRODUCTION DB
  const prodClient = new Client({ host: '127.0.0.1', port: 15432, database: 'medusa', user: 'medusa_user', password: 'Medusa1234' });
  await prodClient.connect();
  await upsertProduct(prodClient, product, imageUrl, brandName, true);
  await prodClient.end();

  console.log('\n🎉 Done! Product synced to both LOCAL and PRODUCTION.');
  console.log('Admin dashboard should now show: Apple 20W USB-C Power Adapter');
  if (!hasOdooImage) {
    console.log('⚠️  NOTE: Odoo developer has NOT added the image yet in Odoo. Ask them to upload it.');
  }
}

main().catch(console.error);
