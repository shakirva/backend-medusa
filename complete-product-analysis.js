const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

const ODOO_URL = process.env.ODOO_URL || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_KEY = process.env.ODOO_API_KEY || '';
const PRODUCT_ID = 71105; // Baseus Encock Headphone Holder DB01

async function run() {
  try {
    console.log(`🔍 Complete Data Analysis for Product ID: ${PRODUCT_ID}`);
    console.log('=' .repeat(70));
    
    // Authenticate
    const auth = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', 
      params: { service: 'common', method: 'authenticate', args: [ODOO_DB, ODOO_USER, ODOO_KEY, {}] }, 
      id: 1
    });
    const uid = auth.data.result;
    if (!uid) return console.log('❌ Authentication failed');
    console.log('✅ Authenticated with UID:', uid);

    // Get product data with all fields
    const productRes = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', 
      method: 'call', 
      params: { 
        service: 'object', 
        method: 'execute_kw', 
        args: [
          ODOO_DB, 
          uid, 
          ODOO_KEY, 
          'product.product', 
          'read',
          [[PRODUCT_ID]], // Read specific product by ID
          {
            'fields': [
              'id', 'name', 'display_name', 'default_code', 'barcode',
              'list_price', 'standard_price', 'currency_id', 
              'categ_id', 'pos_categ_id', 'brand_id',
              'description', 'description_sale', 'description_purchase',
              'qty_available', 'virtual_available', 'incoming_qty',
              'weight', 'volume', 'sale_ok', 'purchase_ok',
              'image_1920', 'image_1024', 'image_512', 'image_256',
              'active', 'company_id', 'uom_id', 'uom_po_id',
              'write_date', 'create_date', 'tracking'
            ]
          }
        ] 
      }, 
      id: 2
    });

    const products = productRes.data.result || [];
    if (products.length === 0) {
      console.log('❌ Product not found in Odoo');
      return;
    }

    const product = products[0];
    console.log('\n📦 COMPLETE ODOO PRODUCT DATA:');
    console.log('=' .repeat(50));
    
    // Basic Info
    console.log('🆔 BASIC INFORMATION:');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Name: ${product.name || 'N/A'}`);
    console.log(`   Display Name: ${product.display_name || 'N/A'}`);
    console.log(`   Internal Reference (SKU): ${product.default_code || 'Not Set'}`);
    console.log(`   Barcode: ${product.barcode || 'Not Set'}`);
    console.log(`   Active: ${product.active ? 'Yes' : 'No'}`);
    
    // Pricing & Currency
    console.log('\n💰 PRICING INFORMATION:');
    console.log(`   Sales Price: ${product.list_price || 0}`);
    console.log(`   Cost Price: ${product.standard_price || 0}`);
    console.log(`   Currency: ${product.currency_id ? `${product.currency_id[1]} (ID: ${product.currency_id[0]})` : 'Not Set'}`);
    
    // Categories & Classification
    console.log('\n🏷️  CATEGORIES & CLASSIFICATION:');
    console.log(`   Product Category: ${product.categ_id ? `${product.categ_id[1]} (ID: ${product.categ_id[0]})` : 'Not Set'}`);
    console.log(`   POS Category: ${product.pos_categ_id ? `${product.pos_categ_id[1]} (ID: ${product.pos_categ_id[0]})` : 'Not Set'}`);
    console.log(`   Brand: ${product.brand_id ? `${product.brand_id[1]} (ID: ${product.brand_id[0]})` : 'Not Set'}`);
    
    // Inventory & Stock
    console.log('\n📊 INVENTORY & STOCK:');
    console.log(`   Available Quantity: ${product.qty_available || 0}`);
    console.log(`   Forecasted Quantity: ${product.virtual_available || 0}`);
    console.log(`   Incoming Quantity: ${product.incoming_qty || 0}`);
    console.log(`   Tracking: ${product.tracking || 'none'}`);
    
    // Physical Properties
    console.log('\n📏 PHYSICAL PROPERTIES:');
    console.log(`   Weight: ${product.weight || 0} kg`);
    console.log(`   Volume: ${product.volume || 0} m³`);
    
    // Sales & Purchase Settings
    console.log('\n🛒 SALES & PURCHASE:');
    console.log(`   Can be Sold: ${product.sale_ok ? 'Yes' : 'No'}`);
    console.log(`   Can be Purchased: ${product.purchase_ok ? 'Yes' : 'No'}`);
    console.log(`   Unit of Measure: ${product.uom_id ? `${product.uom_id[1]} (ID: ${product.uom_id[0]})` : 'Not Set'}`);
    console.log(`   Purchase UoM: ${product.uom_po_id ? `${product.uom_po_id[1]} (ID: ${product.uom_po_id[0]})` : 'Not Set'}`);
    
    // Descriptions
    console.log('\n📝 PRODUCT DESCRIPTIONS:');
    console.log(`   Internal Notes: ${product.description ? (product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description) : 'Empty'}`);
    console.log(`   Sales Description: ${product.description_sale ? (product.description_sale.length > 100 ? product.description_sale.substring(0, 100) + '...' : product.description_sale) : 'Empty'}`);
    console.log(`   Purchase Description: ${product.description_purchase ? (product.description_purchase.length > 100 ? product.description_purchase.substring(0, 100) + '...' : product.description_purchase) : 'Empty'}`);
    
    // Images Analysis
    console.log('\n🖼️  IMAGE ANALYSIS:');
    const imageFields = ['image_1920', 'image_1024', 'image_512', 'image_256'];
    for (const field of imageFields) {
      const hasImage = !!product[field];
      console.log(`   ${field}: ${hasImage ? 'Present' : 'Missing'}`);
    }
    
    // Test main image if exists
    if (product.image_1920) {
      const imageUrl = `${ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
      try {
        const head = await axios.head(imageUrl);
        const len = parseInt(head.headers['content-length'] || '0');
        const ct = head.headers['content-type'] || 'unknown';
        console.log(`\n   📸 Image URL Test:`);
        console.log(`   URL: ${imageUrl}`);
        console.log(`   Content-Type: ${ct}`);
        console.log(`   File Size: ${len} bytes`);
        console.log(`   Status: ${len > 10000 ? '🎉 REAL IMAGE!' : '⚠️  Placeholder (too small)'}`);
        
        if (len <= 6078 && len >= 6070) {
          console.log(`   🔍 Detected: Standard Odoo placeholder (exactly ${len} bytes)`);
        }
      } catch (e) {
        console.log(`   ❌ Image URL Error: ${e.message}`);
      }
    }
    
    // Company & Timestamps
    console.log('\n🏢 COMPANY & TIMESTAMPS:');
    console.log(`   Company: ${product.company_id ? `${product.company_id[1]} (ID: ${product.company_id[0]})` : 'Default'}`);
    console.log(`   Created: ${product.create_date || 'Unknown'}`);
    console.log(`   Last Modified: ${product.write_date || 'Unknown'}`);
    
    // Now check MedusaJS data
    console.log('\n' + '=' .repeat(70));
    console.log('📦 MEDUSAJS COMPARISON:');
    console.log('=' .repeat(50));
    
    try {
      const sql = `
        SELECT 
          p.id as product_id,
          p.title,
          p.handle,
          p.description,
          p.status,
          p.metadata,
          p.thumbnail,
          i.url as thumbnail_url,
          v.id as variant_id,
          v.title as variant_title,
          v.sku,
          v.barcode as variant_barcode,
          v.weight,
          v.metadata as variant_metadata,
          pr.amount as price_amount,
          pr.currency_code,
          c.name as collection_name
        FROM product p
        LEFT JOIN image i ON i.id = p.thumbnail
        LEFT JOIN product_variant v ON v.product_id = p.id
        LEFT JOIN price pr ON pr.variant_id = v.id AND pr.price_set_id IS NOT NULL
        LEFT JOIN product_collection_product pcp ON pcp.product_id = p.id
        LEFT JOIN product_collection c ON c.id = pcp.collection_id
        WHERE p.metadata->>'odoo_id' = '${product.id}'
        LIMIT 5;
      `;
      
      const out = execSync(`PGPASSWORD=marqa123 psql -h localhost -U marqa_user -d marqa_souq_dev -c "${sql.replace(/"/g,'\\"')}"`, { encoding: 'utf8' });
      
      if (out.trim()) {
        console.log('✅ Product found in MedusaJS database:');
        console.log(out.trim());
      } else {
        console.log('❌ Product NOT found in MedusaJS database');
        console.log('💡 This means the product exists in Odoo but has not been synced to MedusaJS yet.');
      }
      
    } catch (dberr) {
      console.error('❌ DB query failed:', dberr.message);
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ COMPLETE PRODUCT ANALYSIS FINISHED');
    console.log('\n🔄 RECOMMENDATIONS:');
    if (product.image_1920) {
      console.log('1. Image field exists in Odoo - check if developer uploaded real photo');
      console.log('2. If still placeholder, ask developer to upload actual product photo');
      console.log('3. After real image upload, run sync: npx ts-node src/scripts/sync-odoo-images.ts');
    } else {
      console.log('1. No image in Odoo - ask developer to upload product photo');
      console.log('2. Ensure all other fields (brand, category, etc.) are properly set');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

run();