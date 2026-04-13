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

async function testRealImageUrls() {
    console.log('🖼️  Testing REAL image URLs (products with >10KB images)...\n');
    
    const uid = await authenticate();
    if (!uid) {
        console.error('❌ Cannot authenticate');
        return;
    }
    
    console.log(`✅ Authenticated as UID: ${uid}\n`);

    try {
        // Get the specific products we know have real images
        const realImageIds = [87870, 87512, 92304, 87869, 84084]; // From previous test
        
        for (const productId of realImageIds.slice(0, 3)) { // Test first 3
            const products = await odooCall('/jsonrpc', {
                service: 'object',
                method: 'execute_kw',
                args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.api_key, 'product.template', 'search_read', [
                    [['id', '=', productId]]
                ], {
                    fields: ['id', 'name', 'image_1920']
                }]
            });
            
            if (products && products.length > 0) {
                const product = products[0];
                const imageSize = product.image_1920 ? Math.floor(product.image_1920.length * 3/4) : 0;
                
                console.log(`📦 Product: ${product.name}`);
                console.log(`   ID: ${product.id}`);
                console.log(`   Image Size: ${imageSize} bytes`);
                
                // Test different image sizes
                const imageSizes = ['1920', '1024', '512', '256', '128'];
                
                for (const size of imageSizes) {
                    const imageUrl = `${ODOO_CONFIG.url}/web/image?model=product.template&field=image_${size}&id=${product.id}`;
                    
                    console.log(`   🔗 Testing image_${size}: ${imageUrl}`);
                    
                    // Test URL accessibility
                    await new Promise((resolve) => {
                        const req = https.get(imageUrl, (res) => {
                            let contentLength = res.headers['content-length'];
                            let contentType = res.headers['content-type'];
                            
                            if (res.statusCode === 200) {
                                console.log(`      ✅ ${res.statusCode} | ${contentType} | ${contentLength} bytes`);
                            } else {
                                console.log(`      ❌ ${res.statusCode} | Error`);
                            }
                            
                            req.abort();
                            resolve();
                        }).on('error', (error) => {
                            console.log(`      ❌ Error: ${error.message}`);
                            resolve();
                        }).setTimeout(5000, () => {
                            req.abort();
                            console.log(`      ⏱️  Timeout`);
                            resolve();
                        });
                    });
                }
                
                console.log('');
            }
        }
        
        // Test what happens with MedusaJS frontend integration
        console.log('🔧 Frontend Integration Test:\n');
        
        const testProduct = realImageIds[0];
        const frontendImageUrl = `${ODOO_CONFIG.url}/web/image?model=product.template&field=image_512&id=${testProduct}`;
        
        console.log('Frontend Image URL Pattern:');
        console.log(`   Next.js remotePatterns: "${new URL(ODOO_CONFIG.url).hostname}"`);
        console.log(`   Image URL: ${frontendImageUrl}`);
        console.log(`   Usage in React: <Image src="${frontendImageUrl}" alt="product" width={512} height={512} />`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRealImageUrls().catch(console.error);