const { Pool } = require('pg');

async function verify() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  // Get one product with image and check all fields
  const result = await pool.query(`
    SELECT 
      p.id,
      p.title,
      p.thumbnail,
      p.metadata
    FROM product p 
    WHERE p.title LIKE '%Porodo 4-in-1 OTG%'
    AND p.deleted_at IS NULL
    LIMIT 1
  `);
  
  if (result.rows.length > 0) {
    const product = result.rows[0];
    console.log("Product:", product.title);
    console.log("ID:", product.id);
    console.log("Thumbnail:", product.thumbnail);
    
    // Check images
    const images = await pool.query(`
      SELECT id, url, rank FROM image 
      WHERE product_id = $1 AND deleted_at IS NULL
    `, [product.id]);
    console.log("Images:", images.rows);
  }
  
  await pool.end();
}
verify().catch(console.error);
