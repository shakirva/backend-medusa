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

async function checkOldAndNewIDs() {
    console.log('🔍 Checking both old ID (71105) and new ID (76326)...\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    const idsToCheck = [71105, 76326];
    
    for (const id of idsToCheck) {
        try {
            const products = await odooCall('/jsonrpc', {
                service: 'object',
                method: 'execute_kw',
                args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                    [['id', '=', id]]
                ], {
                    fields: ['id', 'name', 'write_date', 'create_date', 'image_1920']
                }]
            });

            console.log(`🆔 Checking ID: ${id}`);
            if (products && products.length > 0) {
                const product = products[0];
                const imageSize = product.image_1920 ? Math.floor(product.image_1920.length * 3/4) : 0;
                const isPlaceholder = imageSize <= 7000;
                
                console.log(`✅ FOUND: ${product.name}`);
                console.log(`📅 Created: ${product.create_date}`);
                console.log(`📝 Modified: ${product.write_date}`);
                console.log(`🖼️  Image: ${imageSize} bytes ${isPlaceholder ? '⚠️ (PLACEHOLDER)' : '✅ (REAL IMAGE)'}`);
            } else {
                console.log(`❌ NOT FOUND`);
            }
            console.log('---\n');
            
        } catch (error) {
            console.log(`❌ Error checking ID ${id}: ${error.message}\n`);
        }
    }
    
    // Check if there are products with real images today
    console.log('🔍 Checking for products with REAL images (>10KB) modified today...\n');
    
    try {
        const today = new Date().toISOString().split('T')[0] + ' 00:00:00';
        
        const realImageProducts = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['write_date', '>=', today]]
            ], {
                fields: ['id', 'name', 'write_date', 'image_1920'],
                limit: 20,
                order: 'write_date desc'
            }]
        });

        const withRealImages = realImageProducts.filter(p => {
            const size = p.image_1920 ? Math.floor(p.image_1920.length * 3/4) : 0;
            return size > 10000; // >10KB = real image
        });
        
        if (withRealImages.length > 0) {
            console.log(`✅ Found ${withRealImages.length} products with REAL images modified today:`);
            withRealImages.forEach(p => {
                const size = Math.floor(p.image_1920.length * 3/4);
                console.log(`   ID ${p.id}: ${p.name.substring(0, 50)}... (${size} bytes)`);
            });
        } else {
            console.log('❌ No products with real images modified today');
            console.log('💡 This confirms images were either reset or never properly uploaded');
        }
        
    } catch (error) {
        console.error('❌ Error checking today\'s real images:', error.message);
    }
}

checkOldAndNewIDs().catch(console.error);