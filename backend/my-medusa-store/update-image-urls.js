const { Pool } = require('pg');

async function updateImageUrls() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  // Update relative URLs to absolute URLs
  const result = await pool.query(`
    UPDATE image 
    SET url = 'http://localhost:9000' || url 
    WHERE url LIKE '/static/%' 
    AND url NOT LIKE 'http%'
  `);
  
  console.log("Updated", result.rowCount, "image URLs to absolute paths");

  // Verify
  const check = await pool.query("SELECT url FROM image WHERE url LIKE '%odoo%' LIMIT 3");
  console.log("\nSample URLs:", check.rows);

  await pool.end();
}

updateImageUrls().catch(console.error);
