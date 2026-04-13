const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

const ODOO_URL = process.env.ODOO_URL || 'https://oskarllc-new-27289548.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB_NAME || 'oskarllc-new-27289548';
const ODOO_USER = process.env.ODOO_USERNAME || 'SYG';
const ODOO_KEY = process.env.ODOO_API_KEY || '';

async function run() {
  try {
    console.log('🔍 Comprehensive Product Data Check: Baseus Encock Headphone Holder DB01');
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

    // Get full product data from Odoo - using product ID directly
    const search = await axios.post(`${ODOO_URL}/jsonrpc`, {
      jsonrpc: '2.0', method: 'call', 
      params: { 
        service: 'object', 
        method: 'execute_kw', 
        args: [
          ODOO_DB, uid, ODOO_KEY, 
          'product.product', 
          'search_read', 
          [[['id', '=', 71105]]], // Use the exact ID we found
          { 
            fields: [
              'id', 'name', 'display_name', 'default_code', 'barcode',
              'list_price', 'standard_price', 'currency_id', 
              'categ_id', 'pos_categ_id', 'brand_id',
              'description', 'description_sale', 'description_purchase',
              'qty_available', 'virtual_available', 'incoming_qty',
              'weight', 'volume', 'dimensions',
              'image_1920', 'image_1024', 'image_512', 'image_256', 'image_128',
              'product_tmpl_id', 'product_variant_ids',
              'active', 'sale_ok', 'purchase_ok',
              'taxes_id', 'supplier_taxes_id',
              'write_date', 'create_date',
              'company_id', 'uom_id', 'uom_po_id',
              'tracking', 'route_ids'
            ]
          }
        ] 
      }, 
      id: 2
    });

    const products = search.data.result || [];
    if (products.length === 0) {
      console.log('❌ Product not found in Odoo');
      return;
    }

    const product = products[0];
    console.log('\n📦 ODOO PRODUCT DATA:');
    console.log('=' .repeat(50));
    
    // Basic Info
    console.log('🔖 BASIC INFO:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name || 'N/A'}`);
    console.log(`   Display Name: ${product.display_name || 'N/A'}`);
    console.log(`   SKU/Internal Ref: ${product.default_code || 'N/A'}`);
    console.log(`   Barcode: ${product.barcode || 'N/A'}`);
    console.log(`   Active: ${product.active ? 'Yes' : 'No'}`);
    
    // Pricing
    console.log('\n💰 PRICING:');
    console.log(`   List Price: ${product.list_price || 0}`);
    console.log(`   Cost Price: ${product.standard_price || 0}`);
    console.log(`   Currency: ${product.currency_id ? product.currency_id[1] : 'N/A'}`);
    
    // Categories & Brand
    console.log('\n🏷️  CATEGORIES & BRAND:');
    console.log(`   Category: ${product.categ_id ? product.categ_id[1] : 'N/A'}`);
    console.log(`   POS Category: ${product.pos_categ_id ? product.pos_categ_id[1] : 'N/A'}`);
    console.log(`   Brand: ${product.brand_id ? product.brand_id[1] : 'N/A'}`);
    
    // Inventory
    console.log('\n📊 INVENTORY:');
    console.log(`   Available Qty: ${product.qty_available || 0}`);
    console.log(`   Virtual Available: ${product.virtual_available || 0}`);
    console.log(`   Incoming Qty: ${product.incoming_qty || 0}`);
    console.log(`   Tracking: ${product.tracking || 'none'}`);
    
    // Physical Properties
    console.log('\n📏 PHYSICAL PROPERTIES:');
    console.log(`   Weight: ${product.weight || 0}`);
    console.log(`   Volume: ${product.volume || 0}`);
    console.log(`   Dimensions: ${product.dimensions || 'N/A'}`);
    
    // Sales & Purchase
    console.log('\n🛒 SALES & PURCHASE:');
    console.log(`   Can be Sold: ${product.sale_ok ? 'Yes' : 'No'}`);
    console.log(`   Can be Purchased: ${product.purchase_ok ? 'Yes' : 'No'}`);
    console.log(`   Unit of Measure: ${product.uom_id ? product.uom_id[1] : 'N/A'}`);
    console.log(`   Purchase UoM: ${product.uom_po_id ? product.uom_po_id[1] : 'N/A'}`);
    
    // Descriptions
    console.log('\n📝 DESCRIPTIONS:');
    console.log(`   Description: ${product.description ? (product.description.substring(0, 100) + '...') : 'N/A'}`);
    console.log(`   Sales Description: ${product.description_sale ? (product.description_sale.substring(0, 100) + '...') : 'N/A'}`);
    
    // Images
    console.log('\n🖼️  IMAGES:');
    console.log(`   Image 1920: ${product.image_1920 ? 'Yes' : 'No'}`);
    console.log(`   Image 1024: ${product.image_1024 ? 'Yes' : 'No'}`);
    console.log(`   Image 512: ${product.image_512 ? 'Yes' : 'No'}`);
    console.log(`   Image 256: ${product.image_256 ? 'Yes' : 'No'}`);
    
    // Test image URL
    if (product.image_1920) {
      const imageUrl = `${ODOO_URL}/web/image/product.product/${product.id}/image_1920`;
      try {
        const head = await axios.head(imageUrl);
        const len = head.headers['content-length'] || 'unknown';
        const ct = head.headers['content-type'] || 'unknown';
        console.log(`   Image URL: ${imageUrl}`);
        console.log(`   Content-Type: ${ct}, Size: ${len} bytes`);
        
        if (parseInt(len) > 10000) {
          console.log(`   🎉 REAL IMAGE DETECTED! (${len} bytes > 10KB)`);
        } else {
          console.log(`   ⚠️  Likely placeholder (${len} bytes < 10KB)`);
        }
      } catch (e) {
        console.log(`   ❌ Image URL not accessible: ${e.message}`);
      }
    }
    
    // Dates
    console.log('\n📅 TIMESTAMPS:');
    console.log(`   Created: ${product.create_date || 'N/A'}`);
    console.log(`   Last Modified: ${product.write_date || 'N/A'}`);
    
    // Now check what's in MedusaJS
    console.log('\n' + '=' .repeat(70));
    console.log('📦 MEDUSAJS PRODUCT DATA:');
    console.log('=' .repeat(50));
    
    try {
      const sql = `
        SELECT 
          p.id, p.title, p.handle, p.description, p.status,
          p.metadata->>'odoo_id' as odoo_id,
          p.metadata->>'brand' as brand,
          p.metadata->>'category' as category,
          p.thumbnail,
          i.url as image_url,
          v.title as variant_title,
          v.sku,
          v.barcode,
          v.weight,
          v.metadata as variant_metadata,
          pr.amount as price_amount,
          pr.currency_code
        FROM product p
        LEFT JOIN image i ON i.id = p.thumbnail
        LEFT JOIN product_variant v ON v.product_id = p.id
        LEFT JOIN price pr ON pr.variant_id = v.id
        WHERE p.metadata->>'odoo_id' = '${product.id}'
        LIMIT 5;
      `;
      
      const out = execSync(`PGPASSWORD=marqa123 psql -h localhost -U marqa_user -d marqa_souq_dev -c "${sql.replace(/"/g,'\\"')}"`, { encoding: 'utf8' });
      console.log('Raw DB Output:');
      console.log(out.trim());
      
    } catch (dberr) {
      console.error('❌ DB query failed:', dberr.message);
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ COMPREHENSIVE DATA CHECK COMPLETE');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

run();