const { Pool } = require('pg');

async function list() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  const result = await pool.query(`
    SELECT p.title 
    FROM product p 
    WHERE p.thumbnail IS NOT NULL 
    AND p.thumbnail LIKE '%odoo%'
    AND p.deleted_at IS NULL
    ORDER BY p.title
  `);
  
  console.log("Products with Odoo images (" + result.rowCount + " total):");
  result.rows.forEach((r, i) => console.log((i+1) + ". " + r.title.trim().substring(0, 60)));
  
  await pool.end();
}
list().catch(console.error);
