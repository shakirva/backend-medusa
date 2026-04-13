require('dotenv').config();
const axios = require('axios');

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB_NAME;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

async function manualImageSync() {
  try {
    console.log('🖼️ Manual Image Sync for Recent Products...');
    
    // Authenticate
    const authRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}]
      },
      id: 1
    });

    const uid = authRes.data.result;
    console.log(`✅ Authenticated! UID: ${uid}`);
    
    // Products we found in both Odoo and MedusaJS but without images
    const productIds = [82235, 86939]; // Pedal Bin, Three-Seat Sofa
    
    console.log(`\n🔍 Syncing images for ${productIds.length} products...`);
    
    for (const odooId of productIds) {
      console.log(`\n📦 Processing Odoo Product ID: ${odooId}`);
      
      // Get product info from Odoo
      const productRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            ODOO_DB,
            uid,
            ODOO_API_KEY,
            'product.product',
            'search_read',
            [[['id', '=', odooId]]],
            { fields: ['id', 'name', 'image_1920'] }
          ]
        },
        id: 2
      });
      
      const product = productRes.data.result[0];
      if (!product) {
        console.log(`   ❌ Product not found in Odoo`);
        continue;
      }
      
      console.log(`   📋 Name: ${product.name}`);
      console.log(`   🖼️ Has Image: ${!!product.image_1920 ? 'YES' : 'NO'}`);
      
      if (product.image_1920) {
        const imageUrl = `${ODOO_URL}/web/image/product.product/${odooId}/image_1920`;
        console.log(`   🔗 Image URL: ${imageUrl}`);
        
        // Test image size
        try {
          const imageRes = await axios.head(imageUrl);
          const size = parseInt(imageRes.headers['content-length'] || '0');
          console.log(`   📏 Image Size: ${size} bytes`);
          
          // This is where we would update MedusaJS with the image URL
          // For now, just log what we would do
          console.log(`   ✅ Would set image URL in MedusaJS database`);
          
        } catch (err) {
          console.log(`   ❌ Image URL not accessible: ${err.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Manual sync complete!`);
    console.log(`\n💡 To apply these images to MedusaJS, run:`);
    console.log(`   npx ts-node src/scripts/sync-odoo-images.ts`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

manualImageSync();