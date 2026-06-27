const axios = require('axios');

async function checkQuant() {
  const url = "https://oskarllc-new-31031096.dev.odoo.com";
  const db = "oskarllc-new-31031096";
  const user = "SYG";
  const pass = "2a420f7cb6d0c1c8f73368131f025f638c30704e";

  try {
    const authRes = await axios.post(`${url}/jsonrpc`, {
      jsonrpc: "2.0", method: "call", id: 1,
      params: { service: "common", method: "authenticate", args: [db, user, pass, {}] }
    });
    const uid = authRes.data.result;

    const quantRes = await axios.post(`${url}/jsonrpc`, {
      jsonrpc: "2.0", method: "call", id: 2,
      params: {
        service: "object", method: "execute_kw",
        args: [db, uid, pass, "stock.quant", "search_read", [[["quantity", ">", 0]]], {
          fields: ["product_id", "location_id", "quantity", "reserved_quantity"],
          limit: 100
        }]
      }
    });

    const items = quantRes.data.result;
    console.log(`stock.quant records with qty > 0: ${items.length}`);
    if (items.length > 0) {
      console.log(items.slice(0, 5));
    }

  } catch (err) {
    console.error(err.message);
  }
}

checkQuant();
