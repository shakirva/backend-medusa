// Test environment variables loading in MedusaJS context
console.log('Environment Variables Test:');
console.log('ODOO_URL:', process.env.ODOO_URL);
console.log('ODOO_DB_NAME:', process.env.ODOO_DB_NAME);
console.log('ODOO_USERNAME:', process.env.ODOO_USERNAME);
console.log('ODOO_API_KEY:', process.env.ODOO_API_KEY ? 'SET' : 'NOT SET');

// Test if our working Node.js approach works in MedusaJS
const https = require('https');

const ODOO_CONFIG = {
    url: process.env.ODOO_URL || 'https://oskarllc-new-27289548.dev.odoo.com',
    db: process.env.ODOO_DB_NAME || 'oskarllc-new-27289548',
    username: process.env.ODOO_USERNAME || 'SYG',
    api_key: process.env.ODOO_API_KEY || 'fa8410bdf3264b91ea393b9f8341626a98ca262a'
};

console.log('\nFinal config:', {
    url: ODOO_CONFIG.url,
    db: ODOO_CONFIG.db,
    username: ODOO_CONFIG.username,
    api_key: ODOO_CONFIG.api_key ? 'SET' : 'NOT SET'
});

async function testAuth() {
    console.log('\n🔄 Testing Odoo authentication...');
    
    try {
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
                    console.log('✅ Authentication successful! UID:', response.result);
                    process.exit(0);
                } catch (e) {
                    console.log('❌ Invalid response:', body);
                    process.exit(1);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Connection error:', error.message);
            process.exit(1);
        });

        req.write(data);
        req.end();
    } catch (error) {
        console.log('❌ Auth test failed:', error.message);
        process.exit(1);
    }
}

testAuth();