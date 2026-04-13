const axios = require('axios');

// Configuration from user
const ODOO_URL = 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB_NAME = 'oskarllc-stage-27028831'; // User provided this different DB name
const ODOO_USERNAME = 'SYG';
const ODOO_API_KEY = '5941b8e316918f7753a4b9845e0315aa072686d4';

async function checkOdooProducts() {
  try {
    console.log('🔍 Checking Odoo Products and Images...');
    console.log(`URL: ${ODOO_URL}`);
    console.log(`Database: ${ODOO_DB_NAME}`);
    console.log(`Username: ${ODOO_USERNAME}`);
    console.log('---\n');

    // 1. Authenticate with Odoo
    console.log('🔐 Authenticating...');
    const authRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [ODOO_DB_NAME, ODOO_USERNAME, ODOO_API_KEY, {}]
      },
      id: 1
    });

    const uid = authRes.data.result;
    console.log(`✅ Authentication result: ${uid}`);
    
    if (!uid) {
      console.log('❌ Authentication failed. Checking with different DB name...');
      
      // Try with the DB name from .env file
      const authRes2 = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: ['oskarllc-new-27289548', ODOO_USERNAME, ODOO_API_KEY, {}]
        },
        id: 1
      });
      
      const uid2 = authRes2.data.result;
      console.log(`✅ Authentication with oskarllc-new-27289548: ${uid2}`);
      
      if (!uid2) {
        console.log('❌ Authentication failed with both DB names');
        return;
      }
      
      // Use the working credentials
      const finalUID = uid2;
      const finalDBName = 'oskarllc-new-27289548';
      
      await analyzeProducts(finalUID, finalDBName);
    } else {
      await analyzeProducts(uid, ODOO_DB_NAME);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function analyzeProducts(uid, dbName) {
  console.log('\n📊 Analyzing Products...');
  
  // 2. Count total products
  const countRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        dbName,
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
  console.log(`📦 Total Products: ${totalProducts}`);

  // 3. Get sample products with images
  const productsRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        dbName,
        uid,
        ODOO_API_KEY,
        'product.product',
        'search_read',
        [[]],
        { 
          fields: ['id', 'name', 'image_1920'], 
          limit: 20 
        }
      ]
    },
    id: 3
  });

  const products = productsRes.data.result;
  console.log(`\n🔍 Checking first 20 products for images:`);
  
  let productsWithImages = 0;
  let productsWithoutImages = 0;
  
  products.forEach((product, index) => {
    const hasImage = !!product.image_1920;
    const status = hasImage ? '✅ HAS IMAGE' : '❌ NO IMAGE';
    console.log(`${index + 1}. ${product.name} (ID: ${product.id}) - ${status}`);
    
    if (hasImage) {
      productsWithImages++;
    } else {
      productsWithoutImages++;
    }
  });

  console.log(`\n📈 Summary (first 20 products):`);
  console.log(`✅ Products with images: ${productsWithImages}`);
  console.log(`❌ Products without images: ${productsWithoutImages}`);
  
  // 4. Check if any products have actual images (not placeholders)
  console.log(`\n🖼️ Testing image URLs for products with images...`);
  
  for (const product of products.slice(0, 5)) {
    if (product.image_1920) {
      const imageUrl = `${ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
      try {
        const imageRes = await axios.head(imageUrl);
        const contentLength = imageRes.headers['content-length'];
        const isPlaceholder = contentLength && parseInt(contentLength) < 10000; // Placeholder is usually small
        
        console.log(`📸 ${product.name}: ${contentLength} bytes ${isPlaceholder ? '(likely placeholder)' : '(likely real image)'}`);
      } catch (err) {
        console.log(`❌ ${product.name}: Image URL not accessible`);
      }
    }
  }
}

checkOdooProducts();