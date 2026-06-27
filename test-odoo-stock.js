const axios = require('axios');

async function checkStock() {
  const url = "https://oskarllc-new-31031096.dev.odoo.com";
  const db = "oskarllc-new-31031096";
  const user = "SYG";
  const pass = "2a420f7cb6d0c1c8f73368131f025f638c30704e";

  try {
    console.log("Authenticating...");
    const authRes = await axios.post(`${url}/jsonrpc`, {
      jsonrpc: "2.0", method: "call", id: 1,
      params: { service: "common", method: "authenticate", args: [db, user, pass, {}] }
    });
    const uid = authRes.data.result;
    console.log("UID:", uid);

    console.log("Fetching stock...");
    const stockRes = await axios.post(`${url}/jsonrpc`, {
      jsonrpc: "2.0", method: "call", id: 2,
      params: {
        service: "object", method: "execute_kw",
        args: [db, uid, pass, "product.product", "search_read", [[["active", "=", true]]], {
          fields: ["default_code", "qty_available"],
          limit: 10000
        }]
      }
    });

    const items = stockRes.data.result;
    let totalStock = 0;
    let itemsWithStock = 0;
    
    for (const item of items) {
      if (item.qty_available > 0) {
        totalStock += item.qty_available;
        itemsWithStock++;
        if (itemsWithStock <= 5) {
          console.log(`Sample > 0: ${item.default_code} - ${item.qty_available}`);
        }
      }
    }
    
    console.log(`\nTotal items: ${items.length}`);
    console.log(`Items with stock > 0: ${itemsWithStock}`);
    console.log(`Total cumulative stock: ${totalStock}`);

  } catch (err) {
    console.error(err.message);
  }
}

checkStock();
