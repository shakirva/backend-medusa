/**
 * Script: Assign products to categories based on Odoo metadata
 * 
 * Maps Odoo category paths (e.g., "All / Saleable / Cable / Braided / A to Lightning")
 * to MedusaJS product_category entries.
 * 
 * Also adds category images and assigns uncategorized products.
 * 
 * Run: node scripts/assign-products-to-categories.js
 */

const knex = require("knex")({
  client: "pg",
  connection: "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev",
})

// Mapping: Odoo level-3 category -> MedusaJS category handle(s)
// Each Odoo category maps to one or more MedusaJS child categories
const ODOO_TO_MEDUSA_MAP = {
  // Odoo Level 3 -> MedusaJS handle
  "Cable": ["cables"],
  "Case": ["mobile-cases"],
  "Screen Guard": ["screen-guards"],
  "LifeStyle": ["home"], // Default for LifeStyle; sub-categories handled separately
  "Charger": ["chargers"],
  "Holder,Stand and Stabilizer": ["holders-stands"],
  "Power Bank": ["power-banks"],
  "Film": ["screen-guards"],
  "Watch Band": ["bands-straps"],
  "Handsfree": ["earphones"],
  "Power Socket": ["power-sockets"],
  "Spare Parts": ["electronics-others"],
  "Smart Watch": ["smart-watches"],
  "Speaker": ["bluetooth-speakers"],
  "Hub": ["usb-hubs"],
  "Computer": ["computer-accessories"],
  "Earphone": ["earphones"],
  "Camera": ["action-cameras"],
  "Battery": ["electronics-others"],
  "FM Transmiter": ["car-chargers-transmitters"],
  "Pencil": ["stylus-pens"],
  "Gaming": ["gaming-devices"],
  "Aroma": ["home"],
  "Projector": ["projectors"],
  "Tablet": ["tablets"],
  "Software": ["electronics-others"],
  "Office Furniture": ["home"],
}

// Sub-category mapping for level 4+ Odoo categories
// This checks ANY segment in the path after level 3
const ODOO_SUB_MAP = {
  // Cable sub-types
  "Braided": "cables",
  "PVC": "cables",
  "Aux Cable": "cables",
  "Hdmi": "hdmi-cables",
  "A to Lightning": "cables",
  "A to Micro": "cables",
  "A to Type C": "cables",
  "C to C": "cables",
  "C to Lightning": "cables",
  "All in One Cable": "cables",
  
  // Case sub-types
  "Apple": "iphone",
  "Samsung": "mobiles",
  "iPhone14": "iphone",
  "iPhone15": "iphone",
  "iPhone16": "iphone",
  "iPhone17": "iphone",
  "Airpods": "earbuds-accessories",
  "iPad": "tablet-cases",
  
  // Charger sub-types
  "Car Charger": "car-chargers-transmitters",
  "Home Charger": "chargers",
  "Universal Charger": "chargers",
  "Wireless Charger": "wireless-chargers",
  "PD": "chargers",
  "PD QC": "chargers",
  "USB A": "chargers",
  "Magsafe": "wireless-chargers",
  
  // Power Bank
  "Under 10K mAh": "power-banks-under-10k",
  "Above 10K mAh": "power-banks-above-10k",
  
  // Computer sub-types
  "Bag": "laptop-cases-covers",
  "Combo": "mouse-keyboard-combos",
  "Keyboard": "keyboards",
  "Monitor": "monitors",
  "Mouse": "mouse",
  "Router": "wireless-routers",
  "Screens": "monitors",
  
  // Earphone sub-types
  "3.5MM": "earphones",
  "Lightning": "earphones",
  
  // LifeStyle sub-categories (level 4)
  "Coffee": "coffee-tea-espresso",
  "Beauty": "shavers-hair-removal",
  "Home Appliance": "home",
  "Car Mount": "mobile-mounts-chargers",
}

// Category images (using generic icon URLs or placeholder paths)
const CATEGORY_IMAGES = {
  "mobile-tablet": "/category/mobile-tablet.png",
  "mobiles": "/category/mobiles.png",
  "tablets": "/category/tablets.png",
  "iphone": "/category/iphone.png",
  "computers-gaming": "/category/computers-gaming.png",
  "laptops": "/category/laptops.png",
  "gaming-devices": "/category/gaming-devices.png",
  "electronics": "/category/electronics.png",
  "earphones-headphones": "/category/earphones.png",
  "speakers-accessories": "/category/speakers.png",
  "watches": "/category/watches.png",
  "cameras": "/category/cameras.png",
  "health-beauty": "/category/health-beauty.png",
  "home-kitchen": "/category/home-kitchen.png",
  "kitchen": "/category/kitchen.png",
  "home": "/category/home.png",
  "fashion": "/category/fashion.png",
  "automotives": "/category/automotives.png",
  "offroad": "/category/offroad.png",
  "hot-deals": "/category/hot-deals.png",
  "toys-games-kids": "/category/toys-games.png",
  // Child categories
  "mobile-cases": "/category/mobile-cases.png",
  "screen-guards": "/category/screen-guards.png",
  "cables": "/category/cables.png",
  "chargers": "/category/chargers.png",
  "power-banks": "/category/power-banks.png",
  "earbuds": "/category/earbuds.png",
  "bluetooth-speakers": "/category/bluetooth-speakers.png",
  "smart-watches": "/category/smart-watches.png",
  "backpacks": "/category/backpacks.png",
  "car-electronics": "/category/car-electronics.png",
}

async function run() {
  console.log("=== PRODUCT-TO-CATEGORY ASSIGNMENT SCRIPT ===\n")

  // 1. Build category handle -> id map
  const catResult = await knex.raw(
    `SELECT id, name, handle, parent_category_id FROM product_category`
  )
  const handleToId = {}
  const idToName = {}
  catResult.rows.forEach((c) => {
    handleToId[c.handle] = c.id
    idToName[c.id] = c.name
  })
  console.log(`Found ${catResult.rows.length} categories in database`)

  // 2. Create missing categories that are needed for mapping
  const newCategories = [
    { handle: "cables", name: "Cables & Adapters", parent: "mobile-tablet" },
    { handle: "chargers", name: "Chargers", parent: "mobile-tablet" },
    { handle: "screen-guards", name: "Screen Guards & Films", parent: "mobile-tablet" },
    { handle: "power-sockets", name: "Power Sockets & Extensions", parent: "electronics" },
    { handle: "holders-stands", name: "Holders & Stands", parent: "mobile-tablet" },
    { handle: "smart-watches", name: "Smart Watches", parent: "electronics" },
    { handle: "wireless-chargers", name: "Wireless Chargers", parent: "mobile-tablet" },
    { handle: "stylus-pens", name: "Stylus Pens", parent: "mobile-tablet" },
    { handle: "power-banks-above-10k", name: "Above 10K mAh", parent: "mobile-tablet" },
    { handle: "portable-speakers", name: "Portable Speakers", parent: "electronics" },
  ]

  for (const cat of newCategories) {
    if (!handleToId[cat.handle]) {
      const parentId = handleToId[cat.parent]
      if (!parentId) {
        console.log(`  ⚠️ Parent ${cat.parent} not found for ${cat.handle}, skipping`)
        continue
      }
      const id = `pcat_auto_${cat.handle.replace(/-/g, "_")}`
      const mpath = `${parentId}.${id}`

      try {
        // Check if handle already exists
        const exists = await knex.raw(`SELECT id FROM product_category WHERE handle = ?`, [cat.handle])
        if (exists.rows.length > 0) {
          handleToId[cat.handle] = exists.rows[0].id
          idToName[exists.rows[0].id] = cat.name
          console.log(`  ℹ️ Category ${cat.handle} already exists: ${exists.rows[0].id}`)
          continue
        }

        await knex.raw(
          `INSERT INTO product_category (id, name, handle, mpath, parent_category_id, description, is_active, is_internal, rank, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, '', true, false, 0, NOW(), NOW())`,
          [id, cat.name, cat.handle, mpath, parentId]
        )
        handleToId[cat.handle] = id
        idToName[id] = cat.name
        console.log(`  ✅ Created category: ${cat.name} (${cat.handle}) under ${idToName[parentId]}`)
      } catch (err) {
        console.log(`  ⚠️ Could not create ${cat.handle}: ${err.message}`)
      }
    }
  }

  // 3. Get all products with Odoo category metadata
  const products = await knex.raw(
    `SELECT id, title, handle, metadata->>'odoo_category' as odoo_category 
     FROM product 
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY title`
  )
  console.log(`\nFound ${products.rows.length} published products`)

  // 4. Clear existing assignments and reassign
  await knex.raw(`DELETE FROM product_category_product`)
  console.log("Cleared existing product-category assignments")

  let assigned = 0
  let unassigned = 0
  const assignedProducts = new Set()
  const categoryStats = {}

  for (const product of products.rows) {
    const odooCat = product.odoo_category
    if (!odooCat) {
      unassigned++
      continue
    }

    // Parse Odoo category path: "All / Saleable / Cable / Braided / A to Lightning"
    const parts = odooCat.split(" / ").map((p) => p.trim())
    const level3 = parts[2] // e.g., "Cable"
    const level4 = parts[3] // e.g., "Braided"
    const level5 = parts[4] // e.g., "A to Lightning"

    // Try most specific match first (level 4/5 sub-mapping), then fall back to level 3
    let targetHandles = []

    // Check sub-mapping for deeper levels
    if (level5 && ODOO_SUB_MAP[level5]) {
      targetHandles = [ODOO_SUB_MAP[level5]]
    } else if (level4 && ODOO_SUB_MAP[level4]) {
      targetHandles = [ODOO_SUB_MAP[level4]]
    }

    // Fall back to level 3 mapping
    if (targetHandles.length === 0 && level3 && ODOO_TO_MEDUSA_MAP[level3]) {
      targetHandles = ODOO_TO_MEDUSA_MAP[level3]
    }

    // Assign to first valid handle
    if (targetHandles.length > 0) {
      const targetHandle = targetHandles[0]
      const categoryId = handleToId[targetHandle]
      if (categoryId) {
        try {
          await knex.raw(
            `INSERT INTO product_category_product (product_id, product_category_id)
             VALUES (?, ?)
             ON CONFLICT DO NOTHING`,
            [product.id, categoryId]
          )
          assigned++
          assignedProducts.add(product.id)
          categoryStats[targetHandle] = (categoryStats[targetHandle] || 0) + 1
        } catch (err) {
          // Ignore duplicate errors
        }
      } else {
        unassigned++
      }
    } else {
      unassigned++
    }
  }

  // 5. Assign remaining unassigned products to a general "All Products" or parent category
  // Products without Odoo category go to "electronics-others"
  const fallbackCatId = handleToId["electronics-others"]
  if (fallbackCatId) {
    const unassignedProducts = await knex.raw(
      `SELECT p.id FROM product p 
       WHERE p.status = 'published' AND p.deleted_at IS NULL
       AND p.id NOT IN (SELECT product_id FROM product_category_product)`
    )
    for (const p of unassignedProducts.rows) {
      try {
        await knex.raw(
          `INSERT INTO product_category_product (product_id, product_category_id) 
           VALUES (?, ?) ON CONFLICT DO NOTHING`,
          [p.id, fallbackCatId]
        )
        assigned++
        categoryStats["electronics-others"] = (categoryStats["electronics-others"] || 0) + 1
      } catch (err) {
        // Ignore
      }
    }
  }

  console.log(`\n=== ASSIGNMENT RESULTS ===`)
  console.log(`Total assigned: ${assigned}`)
  console.log(`\n=== PRODUCTS PER CATEGORY ===`)
  const sortedStats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])
  sortedStats.forEach(([handle, count]) => {
    console.log(`  ${count} → ${handle}`)
  })

  // 6. Add category images to metadata
  console.log("\n=== ADDING CATEGORY IMAGES ===")
  let imageCount = 0
  for (const [handle, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
    const catId = handleToId[handle]
    if (catId) {
      await knex.raw(
        `UPDATE product_category SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb), '{image_url}', ?::jsonb
         ) WHERE id = ?`,
        [JSON.stringify(imageUrl), catId]
      )
      imageCount++
    }
  }
  console.log(`Updated ${imageCount} categories with image URLs`)

  // 7. Final stats
  const finalCount = await knex.raw(
    `SELECT COUNT(DISTINCT product_id) as products, COUNT(DISTINCT product_category_id) as categories 
     FROM product_category_product`
  )
  console.log(`\n=== FINAL STATE ===`)
  console.log(`Products assigned to categories: ${finalCount.rows[0].products}`)
  console.log(`Categories with products: ${finalCount.rows[0].categories}`)

  await knex.destroy()
  console.log("\n✅ Done!")
}

run().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
