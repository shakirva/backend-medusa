import { ExecArgs } from "@medusajs/framework/types"

/**
 * Add KWD prices to shipping options
 * 
 * Run: npx medusa exec ./src/scripts/add-kwd-shipping-prices.ts
 */

export default async function addKwdShippingPrices({ container }: ExecArgs) {
  console.log("\n💵 Adding KWD Prices to Shipping Options...")
  console.log("=" .repeat(50))
  
  const fulfillmentModuleService = container.resolve("fulfillment")
  const pricingService = container.resolve("pricing")
  
  // Step 1: Get all shipping options
  console.log("\n1️⃣ Finding shipping options...")
  
  const shippingOptions = await fulfillmentModuleService.listShippingOptions({})
  console.log(`  📦 Found ${shippingOptions.length} shipping options`)
  
  for (const option of shippingOptions) {
    console.log(`\n  Processing: ${option.name} (${option.id})`)
    
    // Get price set for this shipping option via the link
    try {
      const query = container.resolve("query")
      
      // Query for the shipping option with its linked price sets
      const { data } = await query.graph({
        entity: "shipping_option",
        fields: ["id", "name", "price.*"],
        filters: { id: option.id }
      })
      
      if (data && data.length > 0) {
        const optionData = data[0]
        console.log(`    Linked data: ${JSON.stringify(optionData).substring(0, 100)}`)
        
        // Try to find price_set_id from linked prices
        const prices = (optionData as any).price || (optionData as any).prices || []
        if (prices.length > 0) {
          const priceSetId = prices[0]?.price_set_id
          
          if (priceSetId) {
            console.log(`    Price Set ID: ${priceSetId}`)
            
            // Check if KWD price exists
            const existingPrices = await pricingService.listPrices({
              price_set_id: [priceSetId],
              currency_code: ["kwd"]
            })
            
            if (existingPrices.length > 0) {
              console.log(`    ✅ KWD price already exists: ${existingPrices[0].amount}`)
            } else {
              // Add KWD price
              await pricingService.addPrices({
                priceSetId: priceSetId,
                prices: [{
                  amount: 0, // Free shipping
                  currency_code: "kwd"
                }]
              })
              console.log(`    ✅ Added KWD price: 0 (free shipping)`)
            }
          }
        }
      }
    } catch (err: any) {
      console.log(`    ⚠️ Error: ${err.message}`)
      
      // Fallback: Try direct database approach
      try {
        // Get the remote link
        const remoteLink = container.resolve("remoteLink")
        const links = await remoteLink.list({
          shipping_option: { shipping_option_id: option.id }
        })
        console.log(`    Links found: ${links.length}`)
      } catch (linkErr: any) {
        console.log(`    Link error: ${linkErr.message}`)
      }
    }
  }
  
  console.log("\n" + "=" .repeat(50))
  console.log("✅ KWD pricing update completed!")
}
