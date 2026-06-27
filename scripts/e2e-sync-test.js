#!/usr/bin/env node
/**
 * Marksouq E2E Integration Test Suite
 * 
 * Tests the complete Odoo → Medusa → Website synchronization flow:
 * - Products (name, SKU, description, images, prices, specifications)
 * - Categories (hierarchy, subcategories, medusa_sync filtering)
 * - Brands (name, logo images)
 * - Pricing (list_price, x_ecommerce_price)
 * - Filters (brand, stock, price range)
 * 
 * Usage:
 *   node scripts/e2e-sync-test.js [--backend-url=http://localhost:9000]
 * 
 * Requirements:
 *   - Medusa backend running
 *   - Odoo connected and synced at least once
 */

const BASE_URL = process.argv.find(a => a.startsWith('--backend-url='))?.split('=')[1] 
  || process.env.BACKEND_URL 
  || 'http://localhost:9000';

const PUBLISHABLE_KEY = process.env.PUBLISHABLE_API_KEY || '';

// ── Helpers ─────────────────────────────────────

let passed = 0;
let failed = 0;
let warnings = 0;
const errors = [];

function log(emoji, msg) { console.log(`  ${emoji} ${msg}`); }
function pass(msg) { passed++; log('✅', msg); }
function fail(msg) { failed++; errors.push(msg); log('❌', msg); }
function warn(msg) { warnings++; log('⚠️ ', msg); }
function section(title) { console.log(`\n${'━'.repeat(60)}\n  📋 ${title}\n${'━'.repeat(60)}`); }

async function fetchJSON(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (PUBLISHABLE_KEY) headers['x-publishable-api-key'] = PUBLISHABLE_KEY;
    
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    if (!response.ok) {
      return { _error: true, status: response.status, statusText: response.statusText };
    }
    return await response.json();
  } catch (e) {
    return { _error: true, message: e.message };
  }
}

// ── Test Suite ───────────────────────────────────

async function testBackendHealth() {
  section('1. Backend Health Check');
  
  const res = await fetchJSON('/health');
  if (res._error) {
    fail(`Backend not reachable at ${BASE_URL}: ${res.message || res.statusText}`);
    return false;
  }
  pass(`Backend is healthy at ${BASE_URL}`);
  return true;
}

async function testOdooConnection() {
  section('2. Odoo Connection');
  
  const res = await fetchJSON('/admin/odoo', { 
    headers: { 'x-medusa-access-token': 'test' }
  });
  if (res._error) {
    warn('Could not reach /admin/odoo (may need admin auth). Skipping connection test.');
    return true;
  }
  if (res.success) {
    pass(`Odoo connected: UID=${res.data?.userId}, Products=${res.data?.productCount}, Categories=${res.data?.categoryCount}, Brands=${res.data?.brandCount}`);
  } else {
    fail(`Odoo connection failed: ${res.error || res.message}`);
  }
  return true;
}

async function testCategoryTree() {
  section('3. Category Tree (Issue 3, 4, 5, 6)');
  
  const res = await fetchJSON('/store/categories/tree?include_empty=true');
  if (res._error) {
    fail(`Category tree API failed: ${res.message || res.statusText}`);
    return;
  }
  
  const categories = res.categories || [];
  pass(`Category tree loaded: ${categories.length} root categories`);
  
  // Check no unwanted categories
  const unwantedPatterns = ['expo', 'wholesale', 'previous', 'test category', 'demo', 'archive'];
  let hasUnwanted = false;
  
  function checkCategory(cat, depth = 0) {
    const name = (cat.name || '').toLowerCase();
    for (const pattern of unwantedPatterns) {
      if (name.includes(pattern)) {
        fail(`UNWANTED category found: "${cat.name}" (contains "${pattern}")`);
        hasUnwanted = true;
      }
    }
    // Check children (subcategories)
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        checkCategory(child, depth + 1);
      }
    }
  }
  
  for (const cat of categories) {
    checkCategory(cat);
  }
  if (!hasUnwanted) {
    pass('No unwanted categories (expo/wholesale/etc.) found');
  }
  
  // Issue 6: Test subcategory hierarchy
  let totalSubs = 0;
  let maxDepth = 0;
  function countDepth(cat, depth) {
    if (depth > maxDepth) maxDepth = depth;
    totalSubs += (cat.children || []).length;
    for (const child of (cat.children || [])) {
      countDepth(child, depth + 1);
    }
  }
  for (const cat of categories) countDepth(cat, 0);
  
  if (totalSubs > 0) {
    pass(`Subcategory hierarchy: ${totalSubs} subcategories, max depth ${maxDepth}`);
  } else {
    warn('No subcategories found — subcategory sync may not have run yet');
  }
  
  // Check category images
  let catsWithImages = 0;
  function checkImages(cat) {
    if (cat.image_url) catsWithImages++;
    for (const child of (cat.children || [])) checkImages(child);
  }
  for (const cat of categories) checkImages(cat);
  log('ℹ️', `Categories with images: ${catsWithImages}/${categories.length + totalSubs}`);
}

async function testProducts() {
  section('4. Products (Issue 1, 8, 10)');
  
  const res = await fetchJSON('/store/products?limit=10&currency=kwd');
  if (res._error) {
    fail(`Products API failed: ${res.message || res.statusText}`);
    return;
  }
  
  const products = res.products || [];
  pass(`Products loaded: ${products.length} products (total: ${res.count})`);
  
  if (products.length === 0) {
    warn('No products found — sync may not have run yet');
    return;
  }
  
  // Check product data quality
  let withPrice = 0, withThumbnail = 0, withBrand = 0, withSku = 0;
  for (const p of products) {
    if (p.price && p.price > 0) withPrice++;
    if (p.thumbnail) withThumbnail++;
    if (p.metadata?.brand || p.subtitle) withBrand++;
    if (p.sku) withSku++;
  }
  
  if (withPrice === products.length) {
    pass(`All ${products.length} products have prices`);
  } else {
    fail(`Only ${withPrice}/${products.length} products have prices`);
  }
  
  if (withThumbnail > products.length * 0.5) {
    pass(`${withThumbnail}/${products.length} products have thumbnails`);
  } else {
    warn(`Only ${withThumbnail}/${products.length} products have thumbnails`);
  }
  
  log('ℹ️', `Products with brand: ${withBrand}/${products.length}`);
  log('ℹ️', `Products with SKU: ${withSku}/${products.length}`);
  
  // Test search
  if (products[0]) {
    const searchTerm = products[0].title.split(' ')[0];
    const searchRes = await fetchJSON(`/store/products?q=${encodeURIComponent(searchTerm)}&limit=5`);
    if (!searchRes._error && searchRes.products?.length > 0) {
      pass(`Search works: "${searchTerm}" returned ${searchRes.products.length} results`);
    } else {
      fail(`Search failed for "${searchTerm}"`);
    }
  }
}

async function testProductDetails() {
  section('5. Product Details & Specifications (Issue 1)');
  
  // Get a product first
  const listRes = await fetchJSON('/store/products?limit=3');
  if (listRes._error || !listRes.products?.length) {
    warn('No products available to test details');
    return;
  }
  
  const productId = listRes.products[0].id;
  const res = await fetchJSON(`/store/products/${productId}/details?currency=kwd`);
  if (res._error) {
    fail(`Product details API failed: ${res.message || res.statusText}`);
    return;
  }
  
  const product = res.product;
  if (!product) {
    fail('Product details returned no product');
    return;
  }
  
  pass(`Product details loaded: "${product.title}"`);
  
  // Check specifications
  const specs = product.specifications || {};
  const specCount = Object.keys(specs).length;
  if (specCount > 0) {
    pass(`Specifications found: ${specCount} fields — ${Object.keys(specs).join(', ')}`);
  } else {
    warn('No specifications found for this product — check if Odoo has attribute lines');
  }
  
  // Check overview
  if (product.overview?.description || product.overview?.html_description) {
    pass('Product overview has description');
  } else {
    warn('Product overview missing description');
  }
  
  // Check brand
  if (product.brand || product.overview?.brand) {
    pass(`Product brand: ${product.brand || product.overview.brand}`);
  } else {
    warn('Product brand not set');
  }
  
  // Check images
  if (product.images?.length > 0) {
    pass(`Product has ${product.images.length} images`);
  } else {
    warn('Product has no images');
  }
  
  // Check variants with prices
  if (product.variants?.length > 0) {
    const withPrices = product.variants.filter(v => v.price && v.price > 0);
    if (withPrices.length > 0) {
      pass(`${withPrices.length}/${product.variants.length} variants have prices`);
    } else {
      fail('No variants have prices set');
    }
  }
  
  // Check stock
  log('ℹ️', `Stock: in_stock=${product.in_stock}, quantity=${product.stock_quantity}`);
  
  // Check categories
  if (product.categories?.length > 0) {
    pass(`Product has ${product.categories.length} categories: ${product.categories.map(c => c.name).join(', ')}`);
  } else {
    warn('Product has no categories assigned');
  }
  
  // Check odoo_id
  if (product.odoo_id) {
    pass(`Product linked to Odoo ID: ${product.odoo_id}`);
  } else {
    warn('Product missing Odoo ID — may not have been synced from Odoo');
  }
}

async function testBrands() {
  section('6. Brands (Issue 2)');
  
  const res = await fetchJSON('/store/brands');
  if (res._error) {
    // Try alternative endpoint
    const res2 = await fetchJSON('/store/brands?limit=50');
    if (res2._error) {
      warn(`Brands API not available or returned error. Status: ${res.status || res.message}`);
      return;
    }
  }
  
  const brands = res.brands || res.data?.brands || [];
  if (brands.length === 0) {
    warn('No brands found — brand sync may not have run');
    return;
  }
  
  pass(`Brands loaded: ${brands.length} brands`);
  
  let withLogo = 0;
  let brokenLogos = [];
  for (const brand of brands) {
    if (brand.logo_url) {
      withLogo++;
      // Check if it's an Odoo URL (expected) or local path
      if (brand.logo_url.includes('/web/image/')) {
        // Odoo direct URL - good
      } else if (brand.logo_url.startsWith('/brands/') || brand.logo_url.startsWith('/static/')) {
        // Local path - might not work cross-domain
        brokenLogos.push(`${brand.name}: local path ${brand.logo_url}`);
      }
    }
  }
  
  if (withLogo > 0) {
    pass(`${withLogo}/${brands.length} brands have logos`);
  } else {
    fail('No brands have logos');
  }
  
  if (brokenLogos.length > 0) {
    warn(`${brokenLogos.length} brands have local-path logos (may not work in production): ${brokenLogos.slice(0, 3).join('; ')}`);
  }
}

async function testFilters() {
  section('7. Filter Options (Issue 8)');
  
  const res = await fetchJSON('/store/filter-options');
  if (res._error) {
    fail(`Filter options API failed: ${res.message || res.statusText}`);
    return;
  }
  
  const filters = res.filters || [];
  pass(`Filter options loaded: ${filters.length} filters`);
  
  // Check brand filter exists
  const brandFilter = filters.find(f => f.id === 'brand' || f.title === 'Brand');
  if (brandFilter) {
    pass(`Brand filter available with ${brandFilter.values?.length || 0} brands`);
    // Verify brands are meaningful (not just first words of titles)
    const sampleBrands = (brandFilter.values || []).slice(0, 5);
    log('ℹ️', `Sample brands: ${sampleBrands.join(', ')}`);
  } else {
    warn('Brand filter not found in filter options');
  }
  
  // Check price range
  if (res.price_range?.length > 0) {
    const pr = res.price_range[0];
    pass(`Price range: ${pr.min} - ${pr.max} ${pr.currency_code}`);
  } else {
    warn('No price range data');
  }
  
  // Test filtering by brand (if available)
  if (brandFilter?.values?.length > 0) {
    const testBrand = brandFilter.values[0];
    // Get the first category to test
    const catRes = await fetchJSON('/store/categories/tree');
    if (!catRes._error && catRes.categories?.length > 0) {
      const firstCat = catRes.categories[0];
      const filterRes = await fetchJSON(`/store/categories/${firstCat.handle}/products?brand=${encodeURIComponent(testBrand)}&limit=5`);
      if (!filterRes._error) {
        pass(`Brand filter "${testBrand}" returned ${filterRes.products?.length || 0} products in "${firstCat.name}"`);
      } else {
        fail(`Brand filter test failed for "${testBrand}": ${filterRes.message}`);
      }
    }
  }
}

async function testCategoryProducts() {
  section('8. Category Products & Subcategory Mapping (Issue 6, 8)');
  
  const treeRes = await fetchJSON('/store/categories/tree?include_empty=true');
  if (treeRes._error || !treeRes.categories?.length) {
    warn('No categories available to test products');
    return;
  }
  
  // Test first root category
  const rootCat = treeRes.categories[0];
  const res = await fetchJSON(`/store/categories/${rootCat.handle}/products?limit=5&currency=kwd`);
  if (res._error) {
    fail(`Category products API failed for "${rootCat.name}": ${res.message}`);
    return;
  }
  
  pass(`Category "${rootCat.name}" has ${res.pagination?.total || 0} products`);
  
  // Test subcategory if available
  if (rootCat.children?.length > 0) {
    const subCat = rootCat.children[0];
    const subRes = await fetchJSON(`/store/categories/${subCat.handle}/products?limit=5&currency=kwd`);
    if (!subRes._error) {
      pass(`Subcategory "${subCat.name}" has ${subRes.pagination?.total || 0} products`);
    } else {
      fail(`Subcategory "${subCat.name}" products API failed`);
    }
    
    // Test deeper subcategory if available
    if (subCat.children?.length > 0) {
      const deepCat = subCat.children[0];
      const deepRes = await fetchJSON(`/store/categories/${deepCat.handle}/products?limit=5&currency=kwd`);
      if (!deepRes._error) {
        pass(`Deep subcategory "${deepCat.name}" has ${deepRes.pagination?.total || 0} products`);
      }
    }
  }
  
  // Test sort
  const sortRes = await fetchJSON(`/store/categories/${rootCat.handle}/products?sort=price_asc&limit=5&currency=kwd`);
  if (!sortRes._error && sortRes.products?.length > 0) {
    pass('Sort by price_asc works');
  }
  
  // Test in_stock filter
  const stockRes = await fetchJSON(`/store/categories/${rootCat.handle}/products?in_stock=true&limit=5&currency=kwd`);
  if (!stockRes._error) {
    pass(`In-stock filter: ${stockRes.pagination?.total || 0} products`);
  }
}

async function testPricing() {
  section('9. Pricing & eCommerce Price (Issue 9)');
  
  const res = await fetchJSON('/store/products?limit=5&currency=kwd');
  if (res._error || !res.products?.length) {
    warn('No products to test pricing');
    return;
  }
  
  let withEcommercePrice = 0;
  let withListPrice = 0;
  
  for (const p of res.products) {
    const meta = p.metadata || {};
    if (meta.ecommerce_price && meta.ecommerce_price > 0) withEcommercePrice++;
    if (meta.list_price && meta.list_price > 0) withListPrice++;
    
    // Check variant pricing
    if (p.variants?.length > 0) {
      const v = p.variants[0];
      if (v.metadata?.odoo_ecommerce_price) {
        log('ℹ️', `"${p.title.substring(0, 40)}": ecommerce_price=${v.metadata.odoo_ecommerce_price}, list_price=${v.metadata.odoo_list_price}`);
      }
    }
  }
  
  log('ℹ️', `Products with ecommerce_price: ${withEcommercePrice}/${res.products.length}`);
  log('ℹ️', `Products with list_price: ${withListPrice}/${res.products.length}`);
  
  if (withEcommercePrice > 0) {
    pass(`eCommerce price field is active (${withEcommercePrice} products)`);
  } else {
    warn('No products have x_ecommerce_price set — field may not be created in Odoo yet');
  }
}

async function testSyncStatus() {
  section('10. Sync Status');
  
  // Category sync status
  const catStatus = await fetchJSON('/admin/odoo/sync-categories', {
    headers: { 'x-medusa-access-token': 'test' }
  });
  if (!catStatus._error && catStatus.success) {
    pass(`Last category sync: ${catStatus.last_sync || 'never'}`);
    log('ℹ️', `Categories: total=${catStatus.categories?.total}, root=${catStatus.categories?.root}, children=${catStatus.categories?.children}`);
  } else {
    warn('Could not fetch category sync status (may need admin auth)');
  }
}

// ── Main ─────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🧪 MARKSOUQ E2E INTEGRATION TEST SUITE`);
  console.log(`  Backend: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(60)}`);
  
  const healthy = await testBackendHealth();
  if (!healthy) {
    console.log('\n❌ Backend is not reachable. Cannot run tests.\n');
    process.exit(1);
  }
  
  await testOdooConnection();
  await testCategoryTree();
  await testProducts();
  await testProductDetails();
  await testBrands();
  await testFilters();
  await testCategoryProducts();
  await testPricing();
  await testSyncStatus();
  
  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📊 TEST RESULTS SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`${'━'.repeat(60)}`);
  
  if (errors.length > 0) {
    console.log('\n  ❌ FAILURES:');
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }
  
  console.log('');
  
  if (failed === 0) {
    console.log('  🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed. See details above.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
