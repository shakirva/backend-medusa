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

async function checkBaseusDuplicates() {
    console.log('🔍 Checking for Baseus product duplicates and ID issues...\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    console.log(`✅ Authenticated as UID: ${uid}\n`);

    try {
        // Search for ALL Baseus products to see if there are duplicates
        const baseusProducts = await odooCall('/jsonrpc', {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                [['name', 'ilike', 'Baseus Encock Headphone']]
            ], {
                fields: ['id', 'name', 'write_date', 'create_date', 'image_1920'],
                order: 'id desc'
            }]
        });

        console.log(`📦 Found ${baseusProducts.length} Baseus Encock Headphone products:\n`);
        
        for (const product of baseusProducts) {
            const imageSize = product.image_1920 ? Math.floor(product.image_1920.length * 3/4) : 0;
            const isPlaceholder = imageSize <= 7000;
            
            console.log(`🆔 ID: ${product.id}`);
            console.log(`📝 Name: ${product.name}`);
            console.log(`📅 Created: ${product.create_date}`);
            console.log(`📝 Modified: ${product.write_date}`);
            console.log(`🖼️  Image: ${imageSize} bytes ${isPlaceholder ? '⚠️ (PLACEHOLDER)' : '✅ (REAL IMAGE)'}`);
            console.log(`---`);
        }
        
        if (baseusProducts.length > 1) {
            console.log('\n⚠️  MULTIPLE BASEUS PRODUCTS FOUND!');
            console.log('This explains the confusion - you may have uploaded images to a different ID!');
            
            // Find the one with real image
            const withRealImages = baseusProducts.filter(p => {
                const size = p.image_1920 ? Math.floor(p.image_1920.length * 3/4) : 0;
                return size > 7000;
            });
            
            if (withRealImages.length > 0) {
                console.log('\n✅ Products with REAL images:');
                withRealImages.forEach(p => {
                    console.log(`   ID ${p.id}: ${Math.floor(p.image_1920.length * 3/4)} bytes`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBaseusDuplicates().catch(console.error);