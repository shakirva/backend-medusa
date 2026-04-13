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

async function quickProductSync() {
    console.log('🚀 Quick Product Sync Test - Import Missing Products\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    console.log(`✅ Authenticated as UID: ${uid}\n`);

    try {
        // Get product count from Odoo
        const totalOdooProducts = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_count', [[]]]
        });
        
        console.log(`📊 Total products in Odoo: ${totalOdooProducts}`);
        
        // Get sample products with basic fields
        const sampleProducts = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['active', '=', true]]
            ], {
                fields: ['id', 'name', 'default_code', 'list_price', 'image_1920'],
                limit: 5,
                order: 'id desc'
            }]
        });
        
        console.log(`\n📦 Sample products (latest 5):`);
        for (const product of sampleProducts) {
            const imageSize = product.image_1920 ? Math.floor(product.image_1920.length * 3/4) : 0;
            const isPlaceholder = imageSize <= 7000;
            
            console.log(`   ID ${product.id}: ${product.name.substring(0, 50)}...`);
            console.log(`      SKU: ${product.default_code || 'N/A'}`);
            console.log(`      Price: ${product.list_price} KWD`);
            console.log(`      Image: ${imageSize} bytes ${isPlaceholder ? '⚠️ (placeholder)' : '✅ (real)'}`);
            console.log('');
        }
        
        console.log('✅ Odoo connection and data retrieval working perfectly!');
        console.log('\n💡 Next step: Integrate with MedusaJS product import');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickProductSync().catch(console.error);