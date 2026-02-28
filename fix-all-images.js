const { Pool } = require('pg');

async function fixAllImages() {
  const pool = new Pool({
    connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev'
  });

  console.log("🔧 Fixing product images...\n");

  // Get all products with odoo_id but no images
  const productsNoImages = await pool.query(`
    SELECT p.id, p.title, p.metadata->>'odoo_id' as odoo_id
    FROM product p
    WHERE p.metadata->>'odoo_id' IS NOT NULL
    AND p.deleted_at IS NULL
    AND p.thumbnail IS NULL
    AND NOT EXISTS (SELECT 1 FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL)
  `);

  console.log("Products without images:", productsNoImages.rowCount);

  // Get products WITH images (to copy from)
  const productsWithImages = await pool.query(`
    SELECT p.id, p.title, p.thumbnail,
           (SELECT url FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL LIMIT 1) as image_url
    FROM product p
    WHERE p.thumbnail IS NOT NULL
    AND p.deleted_at IS NULL
  `);

  // Create a map of title to image URL
  const imageMap = new Map();
  productsWithImages.rows.forEach(p => {
    const normalTitle = p.title.toLowerCase().trim();
    if (p.image_url) {
      imageMap.set(normalTitle, { thumbnail: p.thumbnail, image_url: p.image_url });
    }
  });

  console.log("Products with images to copy from:", imageMap.size);

  // Update products without images
  let fixed = 0;
  for (const product of productsNoImages.rows) {
    const normalTitle = product.title.toLowerCase().trim();
    const imageData = imageMap.get(normalTitle);
    
    if (imageData) {
      // Add image and thumbnail
      const imageId = `img_fix_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      await pool.query(`
        INSERT INTO image (id, product_id, url, rank, created_at, updated_at)
        VALUES ($1, $2, $3, 0, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [imageId, product.id, imageData.image_url]);
      
      await pool.query(`
        UPDATE product SET thumbnail = $1 WHERE id = $2
      `, [imageData.thumbnail, product.id]);
      
      fixed++;
    }
  }

  console.log("Fixed products:", fixed);

  // Now let's also update thumbnails for products that have images but no thumbnail
  const updateThumbnails = await pool.query(`
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
  
  console.log("Updated thumbnails:", updateThumbnails.rowCount);

  // Final count
  const finalCount = await pool.query(`
    SELECT COUNT(*) as count FROM product 
    WHERE thumbnail IS NOT NULL AND deleted_at IS NULL
  `);
  
  console.log("\n✅ Products with thumbnails now:", finalCount.rows[0].count);
  
  await pool.end();
}

fixAllImages().catch(console.error);
