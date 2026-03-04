const { Client } = require('pg');
const LOCAL_DB = { host:'localhost', port:5432, database:'marqa_souq_dev', user:'marqa_user', password:'marqa123' };
const PROD_DB = { host:'127.0.0.1', port:15432, database:'medusa', user:'medusa_user', password:'Medusa1234' };
function gid(p){const c='0123456789ABCDEFGHJKMNPQRSTVWXYZ';let id=p+'_';for(let i=0;i<26;i++)id+=c[Math.floor(Math.random()*c.length)];return id;}
async function main(){
  const local=new Client(LOCAL_DB), prod=new Client(PROD_DB);
  await local.connect(); console.log('Connected LOCAL');
  await prod.connect(); console.log('Connected PROD');
  const ls=await local.query("SELECT DISTINCT pv.sku FROM product p JOIN product_variant pv ON pv.product_id=p.id WHERE p.status='published' AND pv.sku IS NOT NULL AND pv.sku!='' AND p.deleted_at IS NULL AND pv.deleted_at IS NULL");
  const ps=await prod.query("SELECT DISTINCT pv.sku FROM product p JOIN product_variant pv ON pv.product_id=p.id WHERE pv.sku IS NOT NULL AND pv.sku!='' AND p.deleted_at IS NULL AND pv.deleted_at IS NULL");
  const localSkus=new Set(ls.rows.map(r=>r.sku.trim())), prodSkus=new Set(ps.rows.map(r=>r.sku.trim()));
  const missing=[...localSkus].filter(s=>!prodSkus.has(s));
  console.log('Local:',localSkus.size,'Prod:',prodSkus.size,'Missing:',missing.length);
  if(!missing.length){console.log('Up to date!');return;}
  const sc=await prod.query("SELECT id FROM sales_channel WHERE deleted_at IS NULL LIMIT 1");
  const scId=sc.rows[0]?.id; console.log('SalesChannel:',scId);
  const eh=await prod.query("SELECT handle FROM product WHERE deleted_at IS NULL");
  const handles=new Set(eh.rows.map(r=>r.handle));
  let ok=0,skip=0,err=0;
  for(const sku of missing){
    try{
      const r=await local.query("SELECT p.id as pid,p.title,p.handle,p.subtitle,p.description,p.thumbnail,p.status,p.collection_id,p.metadata as pmeta,p.weight,p.length,p.height,p.width,p.origin_country,p.hs_code,p.mid_code,p.material,p.discountable,p.external_id,p.is_giftcard,pv.id as vid,pv.title as vtitle,pv.sku,pv.barcode,pv.ean,pv.upc,pv.allow_backorder,pv.manage_inventory,pv.hs_code as vhc,pv.origin_country as voc,pv.mid_code as vmc,pv.material as vmt,pv.weight as vw,pv.length as vl,pv.height as vh,pv.width as vwd,pv.metadata as vmeta,pv.variant_rank FROM product p JOIN product_variant pv ON pv.product_id=p.id WHERE pv.sku=$1 AND p.deleted_at IS NULL AND pv.deleted_at IS NULL LIMIT 1",[sku]);
      if(!r.rows.length){skip++;continue;}
      const d=r.rows[0]; let h=d.handle;
      if(handles.has(h)){h=h+'-'+Math.random().toString(36).substr(2,4);if(handles.has(h)){skip++;continue;}}
      let collId=null;
      if(d.collection_id){const cr=await local.query("SELECT handle FROM product_collection WHERE id=$1",[d.collection_id]);if(cr.rows.length){const pr=await prod.query("SELECT id FROM product_collection WHERE handle=$1 AND deleted_at IS NULL",[cr.rows[0].handle]);if(pr.rows.length)collId=pr.rows[0].id;}}
      await prod.query('BEGIN');
      const pid=gid('prod');
      await prod.query("INSERT INTO product(id,title,handle,subtitle,description,thumbnail,status,collection_id,metadata,weight,length,height,width,origin_country,hs_code,mid_code,material,type_id,discountable,external_id,is_giftcard,created_at,updated_at)VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NULL,$17,$18,$19,NOW(),NOW())",[pid,d.title,h,d.subtitle,d.description,d.thumbnail,collId,d.pmeta,d.weight,d.length,d.height,d.width,d.origin_country,d.hs_code,d.mid_code,d.material,d.discountable,d.external_id,d.is_giftcard]);
      handles.add(h);
      const vid=gid('variant');
      await prod.query("INSERT INTO product_variant(id,product_id,title,sku,barcode,ean,upc,allow_backorder,manage_inventory,hs_code,origin_country,mid_code,material,weight,length,height,width,metadata,variant_rank,created_at,updated_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())",[vid,pid,d.vtitle||'Default',d.sku,d.barcode,d.ean,d.upc,d.allow_backorder,d.manage_inventory,d.vhc,d.voc,d.vmc,d.vmt,d.vw,d.vl,d.vh,d.vwd,d.vmeta,d.variant_rank||0]);
      const imgs=await local.query("SELECT url,metadata,rank FROM image WHERE product_id=$1 AND deleted_at IS NULL ORDER BY rank",[d.pid]);
      for(const img of imgs.rows){await prod.query("INSERT INTO image(id,url,metadata,rank,product_id,created_at,updated_at)VALUES($1,$2,$3,$4,$5,NOW(),NOW())",[gid('img'),img.url,img.metadata,img.rank||0,pid]);}
      const prices=await local.query("SELECT pr.amount,pr.raw_amount,pr.currency_code,pr.title as pt,pr.min_quantity,pr.max_quantity,pr.rules_count FROM product_variant_price_set pvps JOIN price pr ON pr.price_set_id=pvps.price_set_id WHERE pvps.variant_id=$1 AND pr.deleted_at IS NULL AND pvps.deleted_at IS NULL",[d.vid]);
      if(prices.rows.length){
        const psid=gid('pset');
        await prod.query("INSERT INTO price_set(id,created_at,updated_at)VALUES($1,NOW(),NOW())",[psid]);
        await prod.query("INSERT INTO product_variant_price_set(id,variant_id,price_set_id,created_at,updated_at)VALUES($1,$2,$3,NOW(),NOW())",[gid('pvps'),vid,psid]);
        for(const pr of prices.rows){await prod.query("INSERT INTO price(id,price_set_id,currency_code,amount,raw_amount,title,min_quantity,max_quantity,rules_count,created_at,updated_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())",[gid('price'),psid,pr.currency_code||'aed',pr.amount,pr.raw_amount||JSON.stringify({value:String(pr.amount),precision:20}),pr.pt,pr.min_quantity,pr.max_quantity,pr.rules_count||0]);}
      }
      if(scId){try{await prod.query("INSERT INTO product_sales_channel(id,product_id,sales_channel_id,created_at,updated_at)VALUES($1,$2,$3,NOW(),NOW()) ON CONFLICT(product_id,sales_channel_id) DO NOTHING",[gid('psc'),pid,scId]);}catch(e){}}
      await prod.query('COMMIT'); ok++;
      if(ok%50===0||ok===1)console.log('Created',ok+'/'+missing.length);
    }catch(e){await prod.query('ROLLBACK').catch(()=>{});err++;if(err<=5)console.error('ERR['+sku+']:',e.message);}
  }
  console.log('\n===DONE=== Created:',ok,'Skipped:',skip,'Errors:',err);
  const fc=await prod.query("SELECT COUNT(*) FROM product WHERE status='published' AND deleted_at IS NULL");
  console.log('Final prod count:',fc.rows[0].count);
  await local.end();await prod.end();
}
main().catch(e=>console.error('FATAL:',e));
