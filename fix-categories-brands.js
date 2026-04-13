/**
 * fix-categories-brands.js
 *
 * 1. Update product_category metadata.image_url with real images (local /category/ or Unsplash)
 * 2. Update brand logo_url to use local /brands/ SVG files for real brands
 * 3. Delete dummy / test brands
 *
 * Run: node fix-categories-brands.js
 */

const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgres://medusa_user:Medusa1234@127.0.0.1:5432/medusa';

// ── Category images ──────────────────────────────────────────────────────────
// Map handle → image URL (prefer local /category/ avif, then Unsplash)
const CATEGORY_IMAGES = {
  // LOCAL AVIF FILES (served from /category/)
  'electronics':              '/category/electronic.avif',
  'mobile-tablet':            '/category/electronic.avif',
  'mobiles':                  '/category/electronic.avif',
  'home-kitchen':             '/category/kitchen.avif',
  'kitchen':                  '/category/kitchen.avif',
  'kitchen-appliances':       '/category/kitchen.avif',
  'health-beauty':            '/category/health-beauty.avif',
  'health':                   '/category/health-beauty.avif',
  'bags':                     '/category/bag.avif',
  'bags-wallets':             '/category/bag.avif',
  'luggages-accessories':     '/category/bag.avif',
  'luggage':                  '/category/bag.avif',
  'offroad':                  '/category/offroad.avif',
  'automotives':              '/category/offroad.avif',
  'car-electronics':          '/category/offroad.avif',

  // SPECIFIC Unsplash images per category
  'power-banks':              'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
  'smart-watches':            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
  'watches':                  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
  'earphones-headphones':     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  'earbuds':                  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
  'earphones':                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  'bluetooth-speakers':       'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
  'home-speakers-soundbars':  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
  'speakers-accessories':     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
  'laptops':                  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
  'macbook':                  'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400&h=400&fit=crop',
  'tablets':                  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
  'cameras':                  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
  'dslr-cameras':             'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
  'action-cameras':           'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
  'drones':                   'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop',
  'gaming-consoles':          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop',
  'computers-gaming':         'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400&h=400&fit=crop',
  'gaming-devices':           'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400&h=400&fit=crop',
  'gaming-keyboards':         'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop',
  'gaming-mouse':             'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
  'gaming-headphones':        'https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop',
  'gaming-chairs':            'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop',
  'gaming-accessories':       'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400&h=400&fit=crop',
  'mobile-accessories':       'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=400&h=400&fit=crop',
  'mobile-cases':             'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=400&h=400&fit=crop',
  'charging-cables':          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
  'mobile-charger':           'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
  'screen-protectors':        'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=400&h=400&fit=crop',
  'computer-accessories':     'https://images.unsplash.com/photo-1593640408182-31c228b4c2b5?w=400&h=400&fit=crop',
  'keyboards':                'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop',
  'mouse':                    'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
  'monitors':                 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
  'printers':                 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop',
  'networking':               'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop',
  'routers':                  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop',
  'smart-home':               'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  'televisions':              'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop',
  'security-cameras':         'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=400&fit=crop',
  'projectors':               'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop',
  'fitness':                  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  'fitness-equipments':       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  'smart-bands':              'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
  'fragrances-perfumes':      'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop',
  'beauty-cosmetics':         'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
  'hair-styling':             'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  'dental-care':              'https://images.unsplash.com/photo-1588776814546-1ffbb174f6aa?w=400&h=400&fit=crop',
  'iphone':                   'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop',
  'samsung-mobiles':          'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400&h=400&fit=crop',
  'hot-deals':                'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop',
  'backpacks':                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
  'travel-accessories':       'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
  'toys-games-kids':          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
  'pet-supplies':             'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=400&fit=crop',
  'stationery':               'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=400&h=400&fit=crop',
  'sports':                   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop',
  'fashion':                  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
  'baby-care':                'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
  'coffee-tea-espresso':      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
  'espresso-machines':        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
  'air-fryers':               'https://images.unsplash.com/photo-1611171711912-e3f4b5e9d5f2?w=400&h=400&fit=crop',
  'blenders-juicers-mixers':  'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
  'vacuum-cleaners':          'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop',
  'storage':                  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop',
  'electric-scooters':        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&h=400&fit=crop',
  'camping-essentials':       'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop',
};

// DEFAULT fallback for any category not in the map
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop';

// ── Brand logos ───────────────────────────────────────────────────────────────
// Map brand name (lowercase) → local logo path
const BRAND_LOGOS = {
  'apple':    '/brands/apple.svg',
  'samsung':  '/brands/samsung.svg',
  'sony':     '/brands/sony.svg',
  'jbl':      '/brands/jbl.svg',
  'bose':     '/brands/bose.svg',
  'anker':    '/brands/anker.svg',
  'logitech': '/brands/logitech.svg',
  'xiaomi':   '/brands/xiaomi.svg',
  'porodo':   '/brands/porodo.svg',
  'harman':   '/brands/harman-kardon.svg',
};

// IDs of dummy/test brands to DELETE
const DUMMY_BRAND_NAMES = [
  'aavannnnne', 'fasd', 'shakir', 'shameer', 'zzzzz', 'aaaaa',
  'aayi', 'adfa', 'nikee', 'ssss', 'ssssssfssamsung', 'shami',
  'testbrand',
];

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to DB\n');

  // ── 1. Update category images ──────────────────────────────────────────────
  console.log('📂 Updating category images...');
  const cats = await client.query('SELECT id, name, handle, metadata FROM product_category');
  let catUpdated = 0;

  for (const row of cats.rows) {
    const handle = row.handle || '';
    const image = CATEGORY_IMAGES[handle] || DEFAULT_IMAGE;
    const currentMeta = row.metadata || {};
    const newMeta = { ...currentMeta, image_url: image };

    await client.query(
      'UPDATE product_category SET metadata = $1 WHERE id = $2',
      [JSON.stringify(newMeta), row.id]
    );
    catUpdated++;
  }
  console.log(`   ✅ Updated ${catUpdated} categories\n`);

  // ── 2. Update real brand logos ─────────────────────────────────────────────
  console.log('🏷️  Updating real brand logos...');
  let brandUpdated = 0;

  for (const [brandName, logoPath] of Object.entries(BRAND_LOGOS)) {
    const result = await client.query(
      'UPDATE brand SET logo_url = $1 WHERE LOWER(name) = $2',
      [logoPath, brandName]
    );
    if (result.rowCount > 0) {
      console.log(`   ✅ ${brandName} → ${logoPath}`);
      brandUpdated += result.rowCount;
    }
  }
  console.log(`   Updated ${brandUpdated} brand logos\n`);

  // ── 3. Delete dummy/test brands ────────────────────────────────────────────
  console.log('🗑️  Deleting dummy/test brands...');
  let deletedCount = 0;

  for (const name of DUMMY_BRAND_NAMES) {
    const result = await client.query(
      'DELETE FROM brand WHERE LOWER(name) = $1',
      [name]
    );
    if (result.rowCount > 0) {
      console.log(`   🗑️  Deleted brand: "${name}"`);
      deletedCount += result.rowCount;
    }
  }
  console.log(`   Deleted ${deletedCount} dummy brands\n`);

  await client.end();
  console.log('🎉 All done! Categories and brands updated successfully.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
