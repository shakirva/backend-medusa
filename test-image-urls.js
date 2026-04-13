const https = require('https');
const fs = require('fs');

const ODOO_CONFIG = {
    url: 'https://oskarllc-new-27289548.dev.odoo.com',
    db: 'oskarllc-new-27289548',
    username: 'SYG',
    api_key: 'fa8410bdf3264b91ea393b9f8341626a98ca262a'
};

async function odooCall(endpoint, params) {
    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: params,
        id: Math.floor(Math.random() * 1000000)
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: new URL(ODOO_CONFIG.url).hostname,
            port: 443,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function authenticate() {
    try {
        const uid = await odooCall('/jsonrpc', {
            service: 'common',
            method: 'authenticate',
            args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.api_key, {}]
        });
        return uid;
    } catch (error) {
        console.error('Authentication failed:', error.message);
        return null;
    }
}

function testImageUrl(url, productName) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            let contentLength = res.headers['content-length'];
            let contentType = res.headers['content-type'];
            
            console.log(`📦 ${productName}:`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Size: ${contentLength} bytes`);
            
            if (res.statusCode === 200) {
                console.log(`   ✅ Image accessible via URL`);
            } else {
                console.log(`   ❌ Failed to access image`);
            }
            console.log('');
            
            // Don't download the whole image, just test access
            req.abort();
            resolve({
                accessible: res.statusCode === 200,
                size: contentLength,
                contentType: contentType
            });
        });
        
        req.on('error', (error) => {
            console.log(`📦 ${productName}:`);
            console.log(`   ❌ Error: ${error.message}`);
            console.log('');
            resolve({ accessible: false, error: error.message });
        });
        
        // Timeout after 10 seconds
        req.setTimeout(10000, () => {
            req.abort();
            console.log(`📦 ${productName}:`);
            console.log(`   ⏱️  Timeout accessing image`);
            console.log('');
            resolve({ accessible: false, error: 'timeout' });
        });
    });
}

async function testImageUrls() {
    console.log('🌐 Testing Odoo image URL accessibility...\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    console.log(`✅ Authenticated as UID: ${uid}\n`);

    try {
        // Get products with real images (>10KB)
        const today = new Date().toISOString().split('T')[0] + ' 00:00:00';
        
        const products = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['write_date', '>=', today]]
            ], {
                fields: ['id', 'name', 'image_1920'],
                limit: 5,
                order: 'write_date desc'
            }]
        });

        const realImageProducts = products.filter(p => {
            const size = p.image_1920 ? Math.floor(p.image_1920.length * 3/4) : 0;
            return size > 10000; // >10KB = real image
        });

        if (realImageProducts.length === 0) {
            console.log('❌ No products with real images found today');
            
            // Test with Baseus (placeholder) anyway
            const baseus = await odooCall('/jsonrpc', {
                service: 'object',
                method: 'execute_kw',
                args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                    [['id', '=', 76326]]
                ], {
                    fields: ['id', 'name', 'image_1920']
                }]
            });
            
            if (baseus && baseus.length > 0) {
                realImageProducts.push(baseus[0]);
            }
        }

        console.log(`🖼️  Testing ${realImageProducts.length} product image URLs:\n`);

        for (const product of realImageProducts.slice(0, 3)) { // Test first 3
            const imageSize = product.image_1920 ? Math.floor(product.image_1920.length * 3/4) : 0;
            
            // Construct Odoo image URL
            const imageUrl = `${ODOO_CONFIG.url}/web/image?model=product.template&field=image_1920&id=${product.id}`;
            
            console.log(`🔗 Testing URL: ${imageUrl}`);
            await testImageUrl(imageUrl, product.name.substring(0, 50));
        }
        
        // Test direct image access without authentication
        console.log('🔓 Testing public access (no auth required):\n');
        
        const testProduct = realImageProducts[0];
        if (testProduct) {
            const publicUrl = `${ODOO_CONFIG.url}/web/image?model=product.template&field=image_1920&id=${testProduct.id}`;
            console.log(`🔗 Public URL: ${publicUrl}`);
            await testImageUrl(publicUrl, testProduct.name.substring(0, 50) + ' (Public)');
        }
        
        // Test with session authentication
        console.log('🔐 Testing with session authentication:\n');
        
        if (testProduct) {
            // This would be the URL format with session auth
            const sessionUrl = `${ODOO_CONFIG.url}/web/image?model=product.template&field=image_1920&id=${testProduct.id}&access_token=dummy`;
            console.log(`🔗 Session URL format: ${sessionUrl}`);
            console.log(`   Note: Real implementation would need valid access token`);
        }
        
    } catch (error) {
        console.error('❌ Error testing image URLs:', error.message);
    }
}

testImageUrls().catch(console.error);