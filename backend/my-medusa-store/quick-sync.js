// Quick Odoo Product Sync - Direct Node.js approach
const https = require('https');

const ODOO_CONFIG = {
    url: 'https://oskarllc-new-27289548.dev.odoo.com',
    db: 'oskarllc-new-27289548',
    username: 'SYG',
    api_key: 'fa8410bdf3264b91ea393b9f8341626a98ca262a'
};

let uid = null;

async function authenticate() {
    console.log('🔐 Authenticating with Odoo...');
    
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'common',
                method: 'authenticate',
                args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.api_key, {}]
            },
            id: 1
        });

        const options = {
            hostname: new URL(ODOO_CONFIG.url).hostname,
            port: 443,
            path: '/jsonrpc',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    uid = response.result;
                    console.log('✅ Authenticated! UID:', uid);
                    resolve(uid);
                } catch (e) {
                    console.log('❌ Auth failed:', body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function fetchProducts(limit = 100) {
    console.log(`📦 Fetching ${limit} products from Odoo...`);
    
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    ODOO_CONFIG.db,
                    uid,
                    ODOO_CONFIG.api_key,
                    'product.template',
                    'search_read',
                    [
                        [['active', '=', true]], // Only active products
                        [
                            'id', 'name', 'default_code', 'list_price', 
                            'categ_id', 'brand_id', 'description_sale',
                            'qty_available', 'image_1920'
                        ]
                    ],
                    { limit: limit }
                ]
            },
            id: 2
        });

        const options = {
            hostname: new URL(ODOO_CONFIG.url).hostname,
            port: 443,
            path: '/jsonrpc',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.error) {
                        console.log('❌ Error:', response.error);
                        reject(new Error(response.error.message));
                    } else {
                        console.log(`✅ Fetched ${response.result.length} products`);
                        resolve(response.result);
                    }
                } catch (e) {
                    console.log('❌ Parse failed:', body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    try {
        await authenticate();
        const products = await fetchProducts(10); // Get first 10 products
        
        console.log('\n📋 Sample Products:');
        products.slice(0, 3).forEach(product => {
            console.log(`  • ${product.name} (${product.default_code || 'No SKU'})`);
            console.log(`    Price: ${product.list_price} | Stock: ${product.qty_available}`);
            console.log(`    Category: ${product.categ_id ? product.categ_id[1] : 'None'}`);
            console.log(`    Brand: ${product.brand_id ? product.brand_id[1] : 'None'}`);
            console.log('');
        });

        console.log('🎉 Odoo connection is working! Ready for full sync.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();