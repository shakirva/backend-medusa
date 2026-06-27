const axios = require('axios');

async function checkWH() {
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
        args: [db, uid, pass, "stock.quant", "search_read", [[["quantity", ">", 0], ["location_id.usage", "=", "internal"]]], {
          fields: ["product_id", "location_id", "quantity"],
          limit: 10000
        }]
      }
    });

    const items = quantRes.data.result;
    console.log(`Internal stock records: ${items.length}`);
  } catch (err) {
    console.error(err.message);
  }
}

checkWH();
