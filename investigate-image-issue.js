const https = require('https');

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

async function investigateImageIssue() {
    console.log('🔍 Investigating why images reverted to placeholders...\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    console.log(`✅ Authenticated as UID: ${uid}\n`);

    // Check Baseus product again with ALL image fields
    try {
        const products = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['id', '=', 71105]]
            ], {
                fields: ['id', 'name', 'image_1920', 'image_1024', 'image_512', 'image_256', 'image_128', 'write_date', 'create_date', '__last_update']
            }]
        });

        if (products && products.length > 0) {
            const product = products[0];
            console.log(`📦 Product: ${product.name}`);
            console.log(`📅 Created: ${product.create_date}`);
            console.log(`📝 Last Modified: ${product.write_date}`);
            console.log(`🔄 Last Update: ${product.__last_update}`);
            console.log('');
            
            // Check all image field sizes
            const imageFields = ['image_1920', 'image_1024', 'image_512', 'image_256', 'image_128'];
            for (const field of imageFields) {
                if (product[field]) {
                    const sizeBytes = Math.floor(product[field].length * 3/4); // Base64 to bytes approximation
                    const isPlaceholder = sizeBytes <= 7000; // Placeholders are usually small
                    console.log(`🖼️  ${field}: ${sizeBytes} bytes ${isPlaceholder ? '⚠️ (PLACEHOLDER)' : '✅ (REAL IMAGE)'}`);
                } else {
                    console.log(`🖼️  ${field}: null/empty`);
                }
            }
            
            console.log('\n🕐 Timeline Analysis:');
            const createDate = new Date(product.create_date);
            const writeDate = new Date(product.write_date);
            const hoursDiff = Math.round((writeDate - createDate) / (1000 * 60 * 60));
            
            console.log(`   Created: ${createDate.toLocaleString()}`);
            console.log(`   Modified: ${writeDate.toLocaleString()}`);
            console.log(`   Time diff: ${hoursDiff} hours`);
            
            if (hoursDiff < 24) {
                console.log('   ⚠️  Product was modified recently - this could explain the issue!');
            }
            
        } else {
            console.log('❌ Product not found');
        }
    } catch (error) {
        console.error('❌ Error checking product:', error.message);
    }
    
    console.log('\n🔍 Checking recent product modifications...');
    
    // Check recent modifications on ALL products
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0] + ' 00:00:00';
        
        const recentProducts = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['write_date', '>=', yesterdayStr]]
            ], {
                fields: ['id', 'name', 'write_date', 'image_1920'],
                limit: 10,
                order: 'write_date desc'
            }]
        });

        console.log(`\n📊 Products modified since ${yesterdayStr}:`);
        if (recentProducts && recentProducts.length > 0) {
            for (const prod of recentProducts) {
                const imageSize = prod.image_1920 ? Math.floor(prod.image_1920.length * 3/4) : 0;
                const isPlaceholder = imageSize <= 7000;
                console.log(`   ${prod.id}: ${prod.name.substring(0, 50)}... (${new Date(prod.write_date).toLocaleString()}) - Image: ${imageSize} bytes ${isPlaceholder ? '⚠️' : '✅'}`);
            }
        } else {
            console.log('   No recent modifications found');
        }
        
    } catch (error) {
        console.error('❌ Error checking recent modifications:', error.message);
    }
}

investigateImageIssue().catch(console.error);