/**
 * Assign Products to Categories and Brands
 * Based on product names and Odoo data
 * 
 * Run with: npx medusa exec ./src/scripts/assign-products-to-categories.ts
 */

import { ExecArgs } from "@medusajs/framework/types";

// Category mapping rules based on product name keywords
const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  // Phones - most specific first
  { keywords: ['iphone 17', 'iphone17'], category: 'smart-phones' },
  { keywords: ['iphone 16', 'iphone16'], category: 'smart-phones' },
  { keywords: ['iphone 15', 'iphone15'], category: 'smart-phones' },
  { keywords: ['iphone 14', 'iphone14'], category: 'smart-phones' },
  { keywords: ['iphone'], category: 'smart-phones' },
  { keywords: ['samsung galaxy s', 'galaxy s24', 'galaxy s25', 'galaxy s23'], category: 'smart-phones' },
  { keywords: ['pixel'], category: 'smart-phones' },
  { keywords: ['xiaomi', 'redmi', 'poco'], category: 'smart-phones' },
  { keywords: ['oneplus'], category: 'smart-phones' },
  
  // AirPods and TWS - check before headphones
  { keywords: ['airpods pro', 'airpods 3', 'airpods 4'], category: 'tws-earbuds' },
  { keywords: ['airpods max'], category: 'headphones' },
  { keywords: ['airpods'], category: 'tws-earbuds' },
  { keywords: ['earbuds', 'tws', 'buds pro', 'buds2', 'galaxy buds'], category: 'tws-earbuds' },
  
  // Headphones
  { keywords: ['headphone', 'headset', 'over-ear', 'on-ear'], category: 'headphones' },
  
  // Laptops
  { keywords: ['macbook'], category: 'laptops' },
  { keywords: ['laptop', 'notebook'], category: 'laptops' },
  
  // Tablets
  { keywords: ['ipad'], category: 'tablet' },
  { keywords: ['tab s', 'galaxy tab'], category: 'tablet' },
  { keywords: ['surface pro'], category: 'tablet' },
  
  // Smart Watches
  { keywords: ['apple watch'], category: 'smart-watches' },
  { keywords: ['galaxy watch'], category: 'smart-watches' },
  { keywords: ['smartwatch', 'smart watch'], category: 'smart-watches' },
  
  // Power Banks - specific first
  { keywords: ['magsafe battery', 'magsafe power bank'], category: 'powerbank-magsafe' },
  { keywords: ['power station'], category: 'power-station' },
  { keywords: ['power generator', 'solar generator'], category: 'power-generator' },
  { keywords: ['power bank', 'powerbank', 'portable charger'], category: 'power-banks' },
  
  // Chargers
  { keywords: ['car charger'], category: 'car-charger' },
  { keywords: ['wireless charger', 'magsafe charger', 'charging pad'], category: 'wireless-charger' },
  { keywords: ['wall charger', 'home charger', 'usb charger', 'power adapter', 'gan charger', 'charging adapter', 'pd charger'], category: 'home-charger' },
  { keywords: ['charger'], category: 'charger' },
  
  // Cables - specific first
  { keywords: ['braided cable', 'nylon cable'], category: 'braided-cable' },
  { keywords: ['hdmi'], category: 'hdmi-cable' },
  { keywords: ['aux cable', 'audio cable', '3.5mm cable'], category: 'aux-cable' },
  { keywords: ['lightning cable', 'usb-c cable', 'type-c cable', 'charging cable', 'cable'], category: 'cable' },
  
  // Cases - specific first
  { keywords: ['iphone 14 case', 'case iphone 14'], category: 'case-iphone-14' },
  { keywords: ['iphone 15 case', 'case iphone 15'], category: 'case-iphone-15' },
  { keywords: ['iphone 16 case', 'case iphone 16'], category: 'case-iphone-16' },
  { keywords: ['iphone 17 case', 'case iphone 17'], category: 'case-iphone-17' },
  { keywords: ['airpods case'], category: 'case-apple-airpods' },
  { keywords: ['samsung case', 'galaxy case'], category: 'case-samsung' },
  { keywords: ['case', 'cover'], category: 'case' },
  
  // Screen Guards
  { keywords: ['screen protector', 'tempered glass', 'screen guard'], category: 'screen-guard' },
  
  // Gaming
  { keywords: ['ps5', 'playstation', 'xbox', 'nintendo', 'switch'], category: 'gaming-console' },
  { keywords: ['gaming headset'], category: 'gaming-headset' },
  { keywords: ['gaming keyboard', 'mechanical keyboard'], category: 'gaming-keyboard' },
  { keywords: ['gaming mouse'], category: 'gaming-mouse' },
  { keywords: ['gaming chair'], category: 'gaming-chair' },
  { keywords: ['gaming'], category: 'gaming' },
  
  // Computer Accessories
  { keywords: ['keyboard'], category: 'computer-keyboard' },
  { keywords: ['mouse'], category: 'computer-mouse' },
  { keywords: ['monitor', 'display'], category: 'computer-monitor' },
  { keywords: ['router', 'wifi'], category: 'computer-router' },
  { keywords: ['laptop bag', 'backpack'], category: 'computer-bag' },
  
  // Speakers
  { keywords: ['speaker', 'soundbar', 'homepod'], category: 'speaker' },
  
  // Holders and Stands
  { keywords: ['car mount', 'car holder'], category: 'car-mount' },
  { keywords: ['desk stand', 'phone stand', 'tablet stand'], category: 'desktop-stand' },
  { keywords: ['tripod'], category: 'tripod' },
  { keywords: ['gimbal', 'stabilizer'], category: 'gimbal' },
  
  // Hub
  { keywords: ['hub', 'docking station', 'dongle'], category: 'hub' },
  
  // Camera
  { keywords: ['camera', 'gopro', 'webcam'], category: 'camera' },
  
  // Smart Tag
  { keywords: ['airtag', 'smart tag', 'tracker'], category: 'smart-tag' },
  
  // Watch Band
  { keywords: ['watch band', 'watch strap', 'sport band'], category: 'watch-band' },
  
  // Pencil
  { keywords: ['apple pencil', 'stylus'], category: 'pencil' },
];

// Brand mapping rules
const BRAND_RULES: { keywords: string[]; brand: string }[] = [
  { keywords: ['iphone', 'ipad', 'macbook', 'airpods', 'apple watch', 'apple pencil', 'airtag', 'magsafe', 'homepod'], brand: 'Apple' },
  { keywords: ['samsung', 'galaxy'], brand: 'Samsung' },
  { keywords: ['sony', 'playstation', 'ps5'], brand: 'Sony' },
  { keywords: ['xiaomi', 'redmi', 'poco'], brand: 'Xiaomi' },
  { keywords: ['porodo'], brand: 'Porodo' },
  { keywords: ['powerology'], brand: 'Powerology' },
  { keywords: ['anker'], brand: 'Anker' },
  { keywords: ['jbl'], brand: 'JBL' },
  { keywords: ['bose'], brand: 'Bose' },
  { keywords: ['marshall'], brand: 'Marshall' },
  { keywords: ['harman', 'kardon'], brand: 'Harman Kardon' },
  { keywords: ['google', 'pixel'], brand: 'Google' },
  { keywords: ['lenovo', 'thinkpad'], brand: 'Lenovo' },
  { keywords: ['logitech'], brand: 'Logitech' },
  { keywords: ['razer'], brand: 'Razer' },
  { keywords: ['beats'], brand: 'Beats' },
];

export default async function assignProductsToCategories({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const pgConnection = container.resolve("__pg_connection__") as any;

  logger.info("🔄 Assigning products to categories based on product names (raw SQL, all products)...\n");

  try {
    // Fetch ALL published products using raw SQL — no limit issues
    const productsResult = await pgConnection.raw(`
      SELECT p.id, p.title,
             COALESCE(
               json_agg(pcp.product_category_id) FILTER (WHERE pcp.product_category_id IS NOT NULL),
               '[]'
             ) AS existing_category_ids
      FROM product p
      LEFT JOIN product_category_product pcp ON pcp.product_id = p.id
      WHERE p.status = 'published' AND p.deleted_at IS NULL
      GROUP BY p.id, p.title
      ORDER BY p.title
    `);
    const products = productsResult.rows || [];
    logger.info(`📦 Found ${products.length} products to process\n`);

    // Fetch all categories
    const catsResult = await pgConnection.raw(`
      SELECT id, handle FROM product_category WHERE deleted_at IS NULL
    `);
    const categoryMap = new Map<string, string>();
    for (const cat of catsResult.rows) {
      categoryMap.set(cat.handle, cat.id);
    }
    logger.info(`📁 Found ${catsResult.rows.length} categories\n`);

    let assignedCount = 0;
    let skippedCount = 0;
    let alreadyCount = 0;

    // Process each product
    for (const product of products) {
      const title = (product.title || '').toLowerCase();
      const existingCategoryIds = new Set<string>(product.existing_category_ids || []);

      // Find matching categories
      const matchedCategoryIds: string[] = [];
      const matchedCategoryNames: string[] = [];

      for (const rule of CATEGORY_RULES) {
        for (const keyword of rule.keywords) {
          if (title.includes(keyword.toLowerCase())) {
            const catId = categoryMap.get(rule.category);
            if (catId && !existingCategoryIds.has(catId) && !matchedCategoryIds.includes(catId)) {
              matchedCategoryIds.push(catId);
              matchedCategoryNames.push(rule.category);
            }
            break;
          }
        }
      }

      if (matchedCategoryIds.length > 0) {
        // Insert new category assignments using raw SQL (ignore duplicates)
        for (const catId of matchedCategoryIds) {
          await pgConnection.raw(`
            INSERT INTO product_category_product (product_id, product_category_id)
            VALUES (?, ?)
            ON CONFLICT DO NOTHING
          `, [product.id, catId]);
        }
        assignedCount++;
        logger.info(`✓ ${product.title}`);
        logger.info(`  → Categories: ${matchedCategoryNames.join(', ')}`);
      } else if (existingCategoryIds.size === 0) {
        skippedCount++;
      } else {
        alreadyCount++;
      }
    }

    logger.info(`\n✅ Category assignment complete!`);
    logger.info(`   Products updated: ${assignedCount}`);
    logger.info(`   Products skipped (no match): ${skippedCount}`);
    logger.info(`   Products already categorized: ${alreadyCount}`);

  } catch (error: any) {
    logger.error(`❌ Error: ${error.message}`);
    throw error;
  }
}
