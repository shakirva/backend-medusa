const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  const result = await pool.query(`
    SELECT 
      p.id,
      p.title,
      p.thumbnail,
      p.metadata->>'odoo_id' as odoo_id,
      (SELECT COUNT(*) FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL) as image_count
    FROM product p 
    WHERE p.title LIKE '%Porodo 4-in-1 OTG%'
    AND p.deleted_at IS NULL
  `);
  
  console.log("All 'Porodo 4-in-1 OTG' products:");
  result.rows.forEach(r => {
    console.log("- ID:", r.id);
    console.log("  Title:", r.title.trim());
    console.log("  Odoo ID:", r.odoo_id);
    console.log("  Images:", r.image_count);
    console.log("  Thumbnail:", r.thumbnail ? "YES" : "NO");
    console.log("");
  });
  
  await pool.end();
}
check().catch(console.error);
