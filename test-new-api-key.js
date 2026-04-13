const axios = require('axios');

const ODOO_URL = 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB = 'oskarllc-new-27289548';
const ODOO_USERNAME = 'SYG';
const ODOO_API_KEY = 'fa8410bdf3264b91ea393b9f8341626a98ca262a';

async function testNewCredentials() {
  try {
    console.log('🎉 Testing NEW API Key Authentication...');
    
    // Test authentication
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
    console.log(`✅ Authentication successful! UID: ${uid}`);
    
    // Test fetching products
    console.log('\n📦 Fetching recent products...');
    const productsRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
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
            fields: ['id', 'name', 'image_1920', 'write_date'], 
            limit: 10,
            order: 'write_date desc'
          }
        ]
      },
      id: 2
    });

    const products = productsRes.data.result;
    console.log(`\n🔍 Found ${products.length} recent products:`);
    
    let productsWithImages = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const hasImage = !!product.image_1920;
      const writeDate = new Date(product.write_date).toLocaleDateString();
      
      console.log(`\n${i + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Updated: ${writeDate}`);
      console.log(`   Has Image: ${hasImage ? '✅ YES' : '❌ NO'}`);
      
      if (hasImage) {
        productsWithImages++;
        const imageUrl = `${ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
        console.log(`   Image URL: ${imageUrl}`);
        
        // Test image accessibility
        try {
          const imageRes = await axios.head(imageUrl);
          const contentLength = parseInt(imageRes.headers['content-length'] || '0');
          const isLikelyReal = contentLength > 10000; // Real images are usually larger
          
          console.log(`   Image Size: ${contentLength} bytes ${isLikelyReal ? '(Real Image! 🎉)' : '(Likely Placeholder)'}`);
        } catch (err) {
          console.log(`   Image URL: ❌ Not accessible`);
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Total products checked: ${products.length}`);
    console.log(`✅ Products with images: ${productsWithImages}`);
    console.log(`\n🚀 Ready to sync products to MedusaJS!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewCredentials();