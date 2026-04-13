const { Client } = require('pg')

const LOCAL_DB = { host: 'localhost', port: 5432, database: 'marqa_souq_dev', user: 'marqa_user', password: 'marqa123' }
const PROD_DB = { host: '127.0.0.1', port: 15432, database: 'medusa', user: 'medusa_user', password: 'Medusa1234' }

function genId(prefix) {
  const c = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let id = prefix + '_'
  for (let i = 0; i < 26; i++) id += c[Math.floor(Math.random() * c.length)]
  return id
}

async function main() {
  const local = new Client(LOCAL_DB)
  const prod = new Client(PROD_DB)
  await local.connect(); console.log('Connected to LOCAL')
  await prod.connect(); console.log('Connected to PRODUCTION')

  const lRes = await local.query(`SELECT DISTINCT pv.sku FROM product p JOIN product_variant pv ON pv.product_id = p.id WHERE p.status='published' AND pv.sku IS NOT NULL AND pv.sku!='' AND p.deleted_at IS NULL AND pv.deleted_at IS NULL`)
  const localSkus = new Set(lRes.rows.map(r => r.sku.trim()))

  const pRes = await prod.query(`SELECT DISTINCT pv.sku FROM product p JOIN product_variant pv ON pv.product_id = p.id WHERE pv.sku IS NOT NULL AND pv.sku!='' AND p.deleted_at IS NULL AND pv.deleted_at IS NULL`)
  const prodSkus = new Set(pRes.rows.map(r => r.sku.trim()))

  const missing = [...localSkus].filter(s => !prodSkus.has(s))
  console.log(`Local: ${localSkus.size}, Prod: ${prodSkus.size}, Missing: ${missing.length}`)
  if (missing.length === 0) { console.log('Up to date!'); return }

  const scRes = await prod.query(`SELECT id FROM sales_channel WHERE deleted_at IS NULL LIMIT 1`)
  const scId = scRes.rows[0]?.id
  console.log(`Sales Channel: ${scId}`)

  const hRes = await prod.query(`SELECT handle FROM product WHERE deleted_at IS NULL`)
  const handles = new Set(hRes.rows.map(r => r.handle))

  let ok = 0, skip = 0, fail = 0

  for (let i = 0; i < missing.length; i++) {
    const sku = missing[i]
    try {
      const lr = await local.query(`
        SELECT p.id as lpid, p.title, p.handle, p.subtitle, p.description, p.thumbnail,
               p.collection_id, p.metadata as pmeta, p.weight, p.length, p.height, p.width,
               p.origin_country, p.hs_code, p.mid_code, p.material, p.discountable, p.external_id, p.is_giftcard,
               pv.id as lvid, pv.title as vtitle, pv.sku, pv.barcode, pv.ean, pv.upc,
               pv.allow_backorder, pv.manage_inventory,
               pv.hs_code as vhc, pv.origin_country as voc, pv.mid_code as vmc, pv.material as vmt,
               pv.weight as vw, pv.length as vl, pv.height as vh, pv.width as vwd,
               pv.metadata as vmeta, pv.variant_rank
        FROM product p JOIN product_variant pv ON pv.product_id = p.id
        WHERE pv.sku = $1 AND p.deleted_at IS NULL AND pv.deleted_at IS NULL LIMIT 1
      `, [sku])
      if (lr.rows.length === 0) { skip++; continue }
      const r = lr.rows[0]

      let handle = r.handle
      if (handles.has(handle)) { handle = handle + '-' + Math.random().toString(36).substring(2,6) }
      if (handles.has(handle)) { skip++; continue }

      let collId = null
      if (r.collection_id) {
        const cr = await local.query('SELECT handle FROM product_collection WHERE id=$1', [r.collection_id])
        if (cr.rows.length > 0) {
          const pcr = await prod.query('SELECT id FROM product_collection WHERE handle=$1 AND deleted_at IS NULL', [cr.rows[0].handle])
          if (pcr.rows.length > 0) collId = pcr.rows[0].id
        }
      }

      await prod.query('BEGIN')

      const pid = genId('prod')
      await prod.query(`INSERT INTO product (id,title,handle,subtitle,description,thumbnail,status,collection_id,metadata,weight,length,height,width,origin_country,hs_code,mid_code,material,type_id,discountable,external_id,is_giftcard,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NULL,$17,$18,$19,NOW(),NOW())`,
        [pid, r.title, handle, r.subtitle, r.description, r.thumbnail, collId, r.pmeta, r.weight, r.length, r.height, r.width, r.origin_country, r.hs_code, r.mid_code, r.material, r.discountable, r.external_id, r.is_giftcard])
      handles.add(handle)

      const vid = genId('variant')
      await prod.query(`INSERT INTO product_variant (id,product_id,title,sku,barcode,ean,upc,allow_backorder,manage_inventory,hs_code,origin_country,mid_code,material,weight,length,height,width,metadata,variant_rank,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())`,
        [vid, pid, r.vtitle||'Default', r.sku, r.barcode, r.ean, r.upc, r.allow_backorder, r.manage_inventory, r.vhc, r.voc, r.vmc, r.vmt, r.vw, r.vl, r.vh, r.vwd, r.vmeta, r.variant_rank||0])

      const imgs = await local.query('SELECT url,metadata,rank FROM image WHERE product_id=$1 AND deleted_at IS NULL ORDER BY rank', [r.lpid])
      for (const img of imgs.rows) {
        await prod.query(`INSERT INTO image (id,url,metadata,rank,product_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`, [genId('img'), img.url, img.metadata, img.rank||0, pid])
      }

      const prices = await local.query(`SELECT pr.amount,pr.raw_amount,pr.currency_code,pr.title as ptitle,pr.min_quantity,pr.max_quantity,pr.rules_count FROM product_variant_price_set pvps JOIN price pr ON pr.price_set_id=pvps.price_set_id WHERE pvps.variant_id=$1 AND pr.deleted_at IS NULL AND pvps.deleted_at IS NULL`, [r.lvid])
      if (prices.rows.length > 0) {
        const psid = genId('pset')
        await prod.query(`INSERT INTO price_set (id,created_at,updated_at) VALUES ($1,NOW(),NOW())`, [psid])
        await prod.query(`INSERT INTO product_variant_price_set (id,variant_id,price_set_id,created_at,updated_at) VALUES ($1,$2,$3,NOW(),NOW())`, [genId('pvps'), vid, psid])
        for (const pr of prices.rows) {
          const rawAmt = pr.raw_amount || JSON.stringify({value:String(pr.amount),precision:20})
          await prod.query(`INSERT INTO price (id,price_set_id,currency_code,amount,raw_amount,title,min_quantity,max_quantity,rules_count,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
            [genId('price'), psid, pr.currency_code||'aed', pr.amount, rawAmt, pr.ptitle, pr.min_quantity, pr.max_quantity, pr.rules_count||0])
        }
      }

      if (scId) {
        try { await prod.query(`INSERT INTO product_sales_channel (id,product_id,sales_channel_id,created_at,updated_at) VALUES ($1,$2,$3,NOW(),NOW()) ON CONFLICT (product_id,sales_channel_id) DO NOTHING`, [genId('psc'), pid, scId]) } catch(e) {}
      }

      await prod.query('COMMIT')
      ok++
      if (ok % 50 === 0 || ok === 1) console.log(`  Created ${ok}/${missing.length}`)
    } catch (err) {
      await prod.query('ROLLBACK').catch(()=>{})
      fail++
      if (fail <= 10) console.error(`  Error [${sku}]: ${err.message}`)
    }
  }

  console.log(`\nDone: created=${ok}, skipped=${skip}, errors=${fail}`)
  const fc = await prod.query("SELECT COUNT(*) FROM product WHERE status='published' AND deleted_at IS NULL")
  const fv = await prod.query("SELECT COUNT(DISTINCT pv.sku) FROM product_variant pv JOIN product p ON p.id=pv.product_id WHERE p.status='published' AND p.deleted_at IS NULL AND pv.deleted_at IS NULL AND pv.sku IS NOT NULL AND pv.sku!=''")
  console.log(`Production: ${fc.rows[0].count} products, ${fv.rows[0].count} SKUs`)

  await local.end(); await prod.end()
}
main().catch(e => { console.error(e); process.exit(1) })
