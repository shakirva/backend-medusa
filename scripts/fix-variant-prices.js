#!/usr/bin/env node
/**
 * Fix Missing Variant Prices
 * 
 * This script adds price sets to all product variants that are missing them.
 * Products synced from Odoo often don't have prices configured in Medusa's
 * pricing system, which causes the product detail pages to not load properly.
 * 
 * Usage: node scripts/fix-variant-prices.js
 */

const { Client } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'medusa',
  user: process.env.DATABASE_USER || 'medusa_user',
  password: process.env.DATABASE_PASSWORD || 'Medusa1234',
};

// Default price in smallest unit (e.g., 1000 = 1.000 KWD for 3 decimal places)
const DEFAULT_PRICE = 0; // 0 means "Contact for Price" 
const CURRENCY_CODE = 'eur'; // Must match region currency
const REGION_ID = 'reg_01KAARY0EYGZY423VSZV7DVX25';

function generateId(prefix) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}`;
}

async function main() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Find all variants without price sets
    const variantsWithoutPricesQuery = `
      SELECT pv.id as variant_id, pv.sku, pv.title, p.title as product_title
      FROM product_variant pv
      JOIN product p ON pv.product_id = p.id
      LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      WHERE pvps.variant_id IS NULL
      ORDER BY p.title, pv.title
    `;
    
    const variantsResult = await client.query(variantsWithoutPricesQuery);
    console.log(`Found ${variantsResult.rows.length} variants without price sets`);

    if (variantsResult.rows.length === 0) {
      console.log('All variants have price sets. Nothing to do.');
      return;
    }

    // Get the first region's currency for pricing
    const regionQuery = `SELECT id, currency_code FROM region LIMIT 1`;
    const regionResult = await client.query(regionQuery);
    const region = regionResult.rows[0];
    const currencyCode = region?.currency_code || CURRENCY_CODE;
    console.log(`Using currency: ${currencyCode}`);

    let created = 0;
    let errors = 0;

    for (const variant of variantsResult.rows) {
      try {
        // Create price set
        const priceSetId = generateId('pset');
        await client.query(`
          INSERT INTO price_set (id, created_at, updated_at)
          VALUES ($1, NOW(), NOW())
        `, [priceSetId]);

        // Link variant to price set
        await client.query(`
          INSERT INTO product_variant_price_set (variant_id, price_set_id)
          VALUES ($1, $2)
        `, [variant.variant_id, priceSetId]);

        // Create price entry
        const priceId = generateId('price');
        await client.query(`
          INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [priceId, priceSetId, currencyCode, DEFAULT_PRICE, JSON.stringify({ value: String(DEFAULT_PRICE), precision: 20 })]);

        created++;
        if (created % 100 === 0) {
          console.log(`Progress: ${created}/${variantsResult.rows.length} variants processed`);
        }
      } catch (err) {
        console.error(`Error processing variant ${variant.variant_id} (${variant.sku}):`, err.message);
        errors++;
      }
    }

    console.log(`\nCompleted:`);
    console.log(`  - Created price sets for ${created} variants`);
    console.log(`  - Errors: ${errors}`);
    console.log(`\nNote: Prices are set to ${DEFAULT_PRICE} ${currencyCode.toUpperCase()}`);
    console.log(`You can update prices in the Medusa Admin dashboard or via Odoo sync.`);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
