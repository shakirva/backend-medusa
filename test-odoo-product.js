const axios = require('axios');

async function getOdooProductInfo() {
  try {
    console.log('Testing authentication...');
    
    // Authenticate with Odoo
    const authRes = await axios.post('https://oskarllc-new-27289548.dev.odoo.com/jsonrpc', {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: ['oskarllc-new-27289548', 'SYG', '5941b8e316918f7753a4b9845e0315aa072686d4', {}]
      },
      id: 1
    });
    
    console.log('Auth response:', authRes.data);
    const uid = authRes.data.result;
    console.log('Authenticated UID:', uid);
    
    if (!uid) {
      console.log('Authentication failed');
      return;
    }
    
    // Fetch product info
    console.log('Fetching product info for ID 92486...');
    const productRes = await axios.post('https://oskarllc-new-27289548.dev.odoo.com/jsonrpc', {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          'oskarllc-new-27289548',
          uid,
          '5941b8e316918f7753a4b9845e0315aa072686d4',
          'product.product',
          'search_read',
          [[['id', '=', 92486]]],
          { fields: ['id', 'name', 'product_tmpl_id', 'image_1920'] }
        ]
      },
      id: 2
    });
    
    console.log('Product response:', productRes.data);
    
    if (productRes.data.result && productRes.data.result.length > 0) {
      const product = productRes.data.result[0];
      console.log('Product:', product.name);
      console.log('Product Template ID:', product.product_tmpl_id);
      console.log('Has image_1920:', !!product.image_1920);
    } else {
      console.log('No product found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

getOdooProductInfo();