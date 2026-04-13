const { Pool } = require('pg');

async function checkImages() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  // Products WITH images (sorted by title)
  const withImages = await pool.query(`
    SELECT p.title, i.url 
    FROM product p 
    JOIN image i ON i.product_id = p.id 
    WHERE p.deleted_at IS NULL AND i.deleted_at IS NULL
    ORDER BY p.title
    LIMIT 15
  `);
  
  console.log("Products WITH images (" + withImages.rowCount + " shown):");
  withImages.rows.forEach((r, i) => {
    console.log((i+1) + ". " + r.title.substring(0, 50));
  });

  // Count total
  const count = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM product WHERE deleted_at IS NULL) as total_products,
      (SELECT COUNT(DISTINCT product_id) FROM image WHERE deleted_at IS NULL) as products_with_images
  `);
  console.log("\nTotal products:", count.rows[0].total_products);
  console.log("Products with images:", count.rows[0].products_with_images);

  await pool.end();
}

checkImages().catch(console.error);
