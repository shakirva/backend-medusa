#!/usr/bin/env node
/**
 * Script to assign the default shipping profile to all products in Medusa
 * Run: node assign-shipping-profiles.js
 */

const MEDUSA_URL = 'http://localhost:9000';
const SHIPPING_PROFILE_ID = 'sp_01KAARSS7VDEJ1FV8KZBNJ05N1';

async function getToken() {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@marqasouqs.com', password: 'Marqa2024!' }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Failed to get token: ' + JSON.stringify(data));
  return data.token;
}

async function main() {
  console.log('🔐 Logging in...');
  const token = await getToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  let offset = 0;
  const limit = 50;
  let updated = 0;
  let skipped = 0;
  let total = 0;

  do {
    const res = await fetch(`${MEDUSA_URL}/admin/products?limit=${limit}&offset=${offset}&fields=id,title,shipping_profile_id`, { headers });
    const data = await res.json();
    const products = data.products || [];
    total = data.count || 0;

    if (products.length === 0) break;

    console.log(`\n📦 Processing batch: offset=${offset}, batch=${products.length}, total=${total}`);

    // Filter products without the correct shipping profile
    const toUpdate = products.filter(p => p.shipping_profile_id !== SHIPPING_PROFILE_ID);
    const alreadyOk = products.filter(p => p.shipping_profile_id === SHIPPING_PROFILE_ID);
    skipped += alreadyOk.length;
    console.log(`   Need update: ${toUpdate.length} | Already correct: ${alreadyOk.length}`);

    // Update in parallel (5 at a time)
    const batchSize = 5;
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const chunk = toUpdate.slice(i, i + batchSize);
      await Promise.all(chunk.map(async (product) => {
        const updateRes = await fetch(`${MEDUSA_URL}/admin/products/${product.id}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ shipping_profile_id: SHIPPING_PROFILE_ID }),
        });
        if (updateRes.ok) {
          updated++;
        } else {
          const err = await updateRes.text();
          console.error(`   ❌ Failed to update ${product.id} (${product.title}): ${err.slice(0, 100)}`);
        }
      }));
      process.stdout.write(`   Updated: ${updated}\r`);
    }

    offset += limit;
  } while (offset < total);

  console.log(`\n\n✅ Done!`);
  console.log(`   Updated: ${updated} products`);
  console.log(`   Skipped (already had profile): ${skipped} products`);
}

main().catch(console.error);
