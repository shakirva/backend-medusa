const { Pool } = require('pg');
const axios = require('axios');

const ODOO_URL = "https://oskarllc-new-27289548.dev.odoo.com";
const ODOO_DB = "oskarllc-new-27289548";
const ODOO_USER = "SYG";
const ODOO_PASS = "S123456";

async function syncAllImages() {
  console.log("Setting Odoo direct image URLs for ALL products...\n");

  const pool = new Pool({
    connectionString: "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev"
  });

  console.log("1. Authenticating with Odoo...");
  const authRes = await axios.post(ODOO_URL + "/jsonrpc", {
    jsonrpc: "2.0",
    method: "call",
    params: { service: "common", method: "authenticate", args: [ODOO_DB, ODOO_USER, ODOO_PASS, {}] },
    id: 1
  });
  const uid = authRes.data.result;
  console.log("   UID:", uid);

  console.log("\n2. Fetching products from Odoo...");
  const productsRes = await axios.post(ODOO_URL + "/jsonrpc", {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [ODOO_DB, uid, ODOO_PASS, "product.product", "search_read",
        [[["sale_ok", "=", true]]],
        { fields: ["id", "name", "image_1920"], limit: 500 }
      ]
    },
    id: 2
  });
  
  const odooProducts = productsRes.data.result || [];
  console.log("   Found:", odooProducts.length, "products");

  const imageMap = new Map();
  odooProducts.forEach(p => {
    if (p.image_1920 && p.image_1920 !== false) {
      imageMap.set(p.id, true);  // Just track which products have images
    }
  });
  console.log("   With images:", imageMap.size);

  console.log("\n3. Getting MedusaJS products...");
  const medusaProducts = await pool.query(
    "SELECT id, title, metadata->>'odoo_id' as odoo_id, thumbnail FROM product WHERE metadata->>'odoo_id' IS NOT NULL AND deleted_at IS NULL"
  );
  console.log("   Found:", medusaProducts.rowCount, "products");

  console.log("\n4. Setting direct Odoo image URLs...");
  let synced = 0, skipped = 0, noImage = 0;

  for (const product of medusaProducts.rows) {
    const odooId = parseInt(product.odoo_id);
    const hasImage = imageMap.has(odooId);

    if (!hasImage) { noImage++; continue; }

    const existingImage = await pool.query(
      "SELECT id FROM image WHERE product_id = $1 AND url LIKE $2 AND deleted_at IS NULL",
      [product.id, "%" + ODOO_URL + "%"]
    );
    
    if (existingImage.rowCount > 0) { skipped++; continue; }

    try {
      // Use Odoo direct image URL instead of downloading
      const imageUrl = ODOO_URL + "/web/image/product.product/" + odooId + "/image_1920";
      const imageId = "img_sync_" + odooId + "_" + Date.now();

      await pool.query(
        "INSERT INTO image (id, product_id, url, rank, created_at, updated_at) VALUES ($1, $2, $3, 0, NOW(), NOW()) ON CONFLICT DO NOTHING",
        [imageId, product.id, imageUrl]
      );

      await pool.query(
        "UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2",
        [imageUrl, product.id]
      );

      synced++;
      if (synced % 10 === 0) console.log("   Set " + synced + " URLs...");
    } catch (err) {
      console.log("   Error:", err.message);
    }
  }

  console.log("\nDONE!");
  console.log("   Synced:", synced);
  console.log("   Skipped:", skipped);
  console.log("   No image:", noImage);

  const finalCount = await pool.query(
    "SELECT COUNT(*) as c FROM product WHERE thumbnail IS NOT NULL AND deleted_at IS NULL"
  );
  console.log("\n   Total with images:", finalCount.rows[0].c);

  await pool.end();
}

syncAllImages().catch(console.error);
