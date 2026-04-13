const { Pool } = require('pg');

async function fixThumbnails() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  // Check product table structure for thumbnail
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'product' AND column_name LIKE '%thumbnail%'
  `);
  console.log("Thumbnail columns:", cols.rows);

  // Update thumbnail from first image for products that have images but no thumbnail
  const result = await pool.query(`
    UPDATE product p
    SET thumbnail = (
      SELECT i.url FROM image i 
      WHERE i.product_id = p.id AND i.deleted_at IS NULL 
      ORDER BY i.rank LIMIT 1
    )
    WHERE p.thumbnail IS NULL
    AND p.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL)
  `);
  
  console.log("Updated thumbnails for", result.rowCount, "products");

  // Verify
  const verify = await pool.query(`
    SELECT title, thumbnail FROM product 
    WHERE thumbnail IS NOT NULL AND thumbnail LIKE '%odoo%'
    LIMIT 5
  `);
  console.log("\nProducts with thumbnails:", verify.rows);

  await pool.end();
}

fixThumbnails().catch(console.error);
