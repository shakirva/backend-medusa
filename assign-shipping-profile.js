#!/usr/bin/env node
const MEDUSA_URL = 'http://localhost:9000';
const SHIPPING_PROFILE_ID = 'sp_01KAARSS7VDEJ1FV8KZBNJ05N1';

async function main() {
  // Login
  const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@marqasouqs.com', password: 'Marqa2024!' }),
  });
  const { token } = await loginRes.json();
  if (!token) { console.error('Login failed'); process.exit(1); }
  console.log('Logged in OK');

  // Get total count
  const countRes = await fetch(`${MEDUSA_URL}/admin/products?limit=1&fields=id`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { count } = await countRes.json();
  console.log(`Total products: ${count}`);

  let done = 0, errors = 0, offset = 0;
  const LIMIT = 50;

  while (offset < count) {
    const res = await fetch(`${MEDUSA_URL}/admin/products?limit=${LIMIT}&offset=${offset}&fields=id,shipping_profile_id`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { products } = await res.json();
    if (!products || products.length === 0) break;

    const toUpdate = products.filter(p => !p.shipping_profile_id);
    
    await Promise.all(toUpdate.map(async p => {
      try {
        const r = await fetch(`${MEDUSA_URL}/admin/products/${p.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipping_profile_id: SHIPPING_PROFILE_ID }),
        });
        if (r.ok) { done++; } else { errors++; }
      } catch(e) { errors++; }
    }));

    offset += LIMIT;
    process.stdout.write(`\r${offset}/${count} processed, ${done} updated, ${errors} errors`);
  }
  console.log(`\nDone! ${done} updated, ${errors} errors`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
