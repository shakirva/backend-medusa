require('dotenv').config();
const axios = require('axios');

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB_NAME;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

async function countOdooProducts() {
  try {
    console.log('🔢 Counting Products in Odoo...');
    console.log('================================');
    
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
    if (!uid) {
      console.log('❌ Authentication failed');
      return;
    }
    console.log(`✅ Authenticated! UID: ${uid}`);
    
    // Count total products
    console.log('\n📊 Counting products...');
    const countRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
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
          'search_count',
          [[]]
        ]
      },
      id: 2
    });
    
    const totalProducts = countRes.data.result;
    console.log(`📦 Total Products in Odoo: ${totalProducts}`);
    
    // Count products with images
    console.log('\n🖼️ Counting products with images...');
    const withImagesRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
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
          'search_count',
          [[['image_1920', '!=', false]]]
        ]
      },
      id: 3
    });
    
    const productsWithImages = withImagesRes.data.result;
    console.log(`🖼️ Products with Images: ${productsWithImages}`);
    console.log(`❌ Products without Images: ${totalProducts - productsWithImages}`);
    
    // Get sample of recent products
    console.log('\n🔍 Recent Products (last 20):');
    const recentRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
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
          [[]],
          { 
            fields: ['id', 'name', 'image_1920', 'create_date', 'write_date'], 
            limit: 20,
            order: 'write_date desc'
          }
        ]
      },
      id: 4
    });
    
    const recentProducts = recentRes.data.result;
    let recentWithImages = 0;
    
    console.log('\nID\t| Name\t\t\t\t\t| Has Image | Last Updated');
    console.log('-'.repeat(80));
    
    recentProducts.forEach((product, index) => {
      const hasImage = !!product.image_1920;
      const updateDate = new Date(product.write_date).toLocaleDateString();
      const name = product.name.substring(0, 35).padEnd(35);
      
      console.log(`${product.id}\t| ${name}| ${hasImage ? '✅ YES   ' : '❌ NO    '}| ${updateDate}`);
      
      if (hasImage) recentWithImages++;
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`📦 Total Products in Odoo: ${totalProducts}`);
    console.log(`🖼️ Products with Images: ${productsWithImages} (${Math.round(productsWithImages/totalProducts*100)}%)`);
    console.log(`❌ Products without Images: ${totalProducts - productsWithImages} (${Math.round((totalProducts-productsWithImages)/totalProducts*100)}%)`);
    console.log(`📅 Recent 20 with Images: ${recentWithImages}/20`);
    
    // Check our current MedusaJS count for comparison
    console.log('\n🔄 For comparison with MedusaJS:');
    console.log(`   MedusaJS has 2,216 products currently`);
    console.log(`   Odoo has ${totalProducts} products`);
    
    if (totalProducts > 2216) {
      console.log(`   🆕 ${totalProducts - 2216} NEW products available to sync!`);
    } else if (totalProducts < 2216) {
      console.log(`   ⚠️  MedusaJS has MORE products than Odoo`);
    } else {
      console.log(`   ✅ Same number of products`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

countOdooProducts();