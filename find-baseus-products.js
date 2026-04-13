const axios = require('axios');
require('dotenv').config();

const ODOO_URL = process.env.ODOO_URL || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_KEY = process.env.ODOO_API_KEY || '';

async function run() {
  try {
    console.log('🔍 Finding Baseus products in Odoo...');
    
    // Authenticate
    const auth = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', 
      params: { service: 'common', method: 'authenticate', args: [ODOO_DB, ODOO_USER, ODOO_KEY, {}] }, 
      id: 1
    });
    const uid = auth.data.result;
    if (!uid) return console.log('❌ Authentication failed');
    
    // Search for any Baseus products
    const search = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', 
      params: { 
        service: 'object', 
        method: 'execute_kw', 
        args: [
          ODOO_DB, uid, ODOO_KEY, 
          'product.product', 
          'search_read', 
          [[['name', 'ilike', 'Baseus']]], 
          { 
            fields: ['id', 'name', 'image_1920', 'write_date'],
            limit: 20,
            order: 'write_date desc'
          }
        ] 
      }, 
      id: 2
    });

    const products = search.data.result || [];
    console.log(`\nFound ${products.length} Baseus products:`);
    console.log('=' .repeat(80));
    
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const writeDate = new Date(p.write_date).toLocaleDateString();
      console.log(`${i+1}. ID: ${p.id} | ${p.name}`);
      console.log(`   Last Updated: ${writeDate} | Has Image: ${!!p.image_1920 ? 'Yes' : 'No'}`);
      
      if (p.name.toLowerCase().includes('headphone') || p.name.toLowerCase().includes('encock')) {
        console.log(`   🎯 POTENTIAL MATCH! This might be the product you're looking for.`);
        
        // Test image size for this one
        if (p.image_1920) {
          try {
            const imageUrl = `${ODOO_URL}/web/image/product.product/${p.id}/image_1920`;
            const head = await axios.head(imageUrl);
            const len = head.headers['content-length'] || 'unknown';
            console.log(`   Image URL: ${imageUrl}`);
            console.log(`   Image Size: ${len} bytes ${parseInt(len) > 10000 ? '(REAL IMAGE! 🎉)' : '(placeholder ⚠️)'}`);
          } catch (e) {
            console.log(`   Image URL: Not accessible`);
          }
        }
      }
      console.log('');
    }
    
    if (products.length === 0) {
      console.log('No Baseus products found. Trying "headphone"...');
      
      // Try headphone search
      const search2 = await axios.post(`${ODOO_URL}/jsonrpc`, {
        jsonrpc: '2.0', method: 'call', 
        params: { 
          service: 'object', 
          method: 'execute_kw', 
          args: [
            ODOO_DB, uid, ODOO_KEY, 
            'product.product', 
            'search_read', 
            [[['name', 'ilike', 'headphone']]], 
            { 
              fields: ['id', 'name', 'image_1920', 'write_date'],
              limit: 10,
              order: 'write_date desc'
            }
          ] 
        }, 
        id: 3
      });
      
      const headphones = search2.data.result || [];
      console.log(`\nFound ${headphones.length} headphone products:`);
      headphones.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id} | ${p.name} | Has Image: ${!!p.image_1920}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();