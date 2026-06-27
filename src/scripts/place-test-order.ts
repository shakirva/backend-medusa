import { ExecArgs } from "@medusajs/framework/types"
import axios from "axios"

export default async function placeTestOrder({ container }: ExecArgs) {
  const MEDUSA_URL = "http://localhost:9000/store"
  const HEADERS = { "x-publishable-api-key": "pk_3971873a84ad4ec5ea711738227a4be2f078a2fd872f40125628afc860b9887b" }

  try {
    console.log("0. Fetching region...")
    const regions = await axios.get(`${MEDUSA_URL}/regions`, { headers: HEADERS })
    if (!regions.data.regions.length) throw new Error("No regions found")
    const regionId = regions.data.regions[0].id
    
    console.log("1. Fetching products...")
    const prods = await axios.get(`${MEDUSA_URL}/products?limit=10`, { headers: HEADERS })
    if (!prods.data.products.length) throw new Error("No products found")
    const variantId = prods.data.products[0].variants[0].id
    console.log(`Using variant: ${variantId}`)

    console.log("2. Creating cart...")
    const cartRes = await axios.post(`${MEDUSA_URL}/carts`, {
      region_id: regionId
    }, { headers: HEADERS })
    const cartId = cartRes.data.cart.id
    console.log(`Cart created: ${cartId}`)

    console.log("3. Adding line item...")
    await axios.post(`${MEDUSA_URL}/carts/${cartId}/line-items`, {
      variant_id: variantId,
      quantity: 1
    }, { headers: HEADERS })

    console.log("4. Setting email and address...")
    await axios.post(`${MEDUSA_URL}/carts/${cartId}`, {
      email: "test-odoo-sync@example.com",
      shipping_address: {
        first_name: "Test",
        last_name: "Order",
        address_1: "123 Test St",
        city: "Kuwait City",
        country_code: "kw",
        postal_code: "12345"
      }
    }, { headers: HEADERS })

    console.log("5. Getting shipping options...")
    const shipOpts = await axios.get(`${MEDUSA_URL}/shipping-options?cart_id=${cartId}`, { headers: HEADERS })
    if (!shipOpts.data.shipping_options.length) throw new Error("No shipping options found")
    const shipOptId = shipOpts.data.shipping_options[0].id
    
    console.log("6. Setting shipping method...")
    await axios.post(`${MEDUSA_URL}/carts/${cartId}/shipping-methods`, {
      option_id: shipOptId
    }, { headers: HEADERS })

    console.log("7. Creating payment sessions...")
    await axios.post(`${MEDUSA_URL}/carts/${cartId}/payment-sessions`, {}, { headers: HEADERS })

    console.log("8. Completing cart...")
    const completeRes = await axios.post(`${MEDUSA_URL}/carts/${cartId}/complete`, {}, { headers: HEADERS })
    console.log(`✅ Order placed! ID: ${completeRes.data.order?.id || completeRes.data.cart?.id}`)
    
  } catch (error: any) {
    console.error("❌ Failed:", error.response?.data || error.message)
  }
}
