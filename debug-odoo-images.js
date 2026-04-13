require('dotenv').config();
const axios = require('axios');

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB_NAME = process.env.ODOO_DB_NAME;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

console.log('🔍 Testing Odoo Connection with Environment Variables...');
console.log(`URL: ${ODOO_URL}`);
console.log(`DB: ${ODOO_DB_NAME}`);
console.log(`Username: ${ODOO_USERNAME}`);
console.log(`API Key: ${ODOO_PASSWORD ? 'Set' : 'Not Set'}`);
console.log('---\n');

async function testOdooConnection() {
  try {
    // Test 1: Try with Password
    console.log('🔐 Testing authentication with Password...');
    let authRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [ODOO_DB_NAME, ODOO_USERNAME, ODOO_PASSWORD, {}]
      },
      id: 1
    });

    let uid = authRes.data.result;
    console.log(`✅ Authentication with Password: ${uid}`);
    
    // If password fails, try with API key
    if (!uid) {
      console.log('🔐 Password failed, trying with API key...');
      const ODOO_API_KEY = process.env.ODOO_API_KEY;
      
      authRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [ODOO_DB_NAME, ODOO_USERNAME, ODOO_API_KEY, {}]
        },
        id: 1
      });
      
      uid = authRes.data.result;
      console.log(`✅ Authentication with API Key: ${uid}`);
    }
    
    if (!uid) {
      console.log('❌ Authentication failed with both Password and API Key');
      return;
    }

    // Test 2: Get recent products to check for images
    console.log('\n📦 Fetching recent products...');
    const productsRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          ODOO_DB_NAME,
          uid,
          ODOO_PASSWORD || process.env.ODOO_API_KEY,
          'product.product',
          'search_read',
          [[]],
          { 
            fields: ['id', 'name', 'image_1920', 'write_date'], 
            limit: 10,
            order: 'write_date desc'  // Get recently updated products
          }
        ]
      },
      id: 2
    });

    const products = productsRes.data.result;
    console.log(`\n🔍 Recent Products (last updated):`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const hasImage = !!product.image_1920;
      const writeDate = new Date(product.write_date).toLocaleDateString();
      
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Last Updated: ${writeDate}`);
      console.log(`   Has Image: ${hasImage ? '✅ YES' : '❌ NO'}`);
      
      if (hasImage) {
        // Test the image URL
        const imageUrl = `${ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
        console.log(`   Image URL: ${imageUrl}`);
        
        try {
          const imageRes = await axios.head(imageUrl);
          const contentLength = parseInt(imageRes.headers['content-length'] || '0');
          const isPlaceholder = contentLength < 10000; // Placeholders are usually small
          
          console.log(`   Image Size: ${contentLength} bytes ${isPlaceholder ? '(likely placeholder)' : '(likely real image)'}`);
        } catch (err) {
          console.log(`   Image URL: ❌ Not accessible`);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testOdooConnection();