const { Pool } = require('pg');

async function fixImages() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  // Check current image status
  const images = await pool.query("SELECT id, url, product_id FROM image WHERE url LIKE '%odoo%' LIMIT 5");
  console.log("Current Odoo images:", images.rows);

  // Check products with odoo_id that have images
  const productsWithImages = await pool.query(`
    SELECT p.id, p.title, i.url 
    FROM product p 
    JOIN image i ON i.product_id = p.id 
    WHERE p.metadata->>'odoo_id' IS NOT NULL 
    LIMIT 5
  `);
  console.log("\nProducts with images:", productsWithImages.rows);

  // Count products with/without images
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_odoo_products,
      COUNT(i.id) as with_images
    FROM product p
    LEFT JOIN image i ON i.product_id = p.id
    WHERE p.metadata->>'odoo_id' IS NOT NULL
  `);
  console.log("\nStats:", stats.rows[0]);

  await pool.end();
}

fixImages().catch(console.error);
