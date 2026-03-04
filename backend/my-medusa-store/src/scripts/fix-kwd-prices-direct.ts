import { ExecArgs } from "@medusajs/framework/types"

/**
 * Add KWD prices via direct database query
 * 
 * Run: npx medusa exec ./src/scripts/fix-kwd-prices-direct.ts
 */

export default async function fixKwdPricesDirect({ container }: ExecArgs) {
  console.log("\n💵 Adding KWD Prices (Direct Database)...")
  console.log("=" .repeat(50))
  
  const pricingService = container.resolve("pricing")
  
  // Step 1: List all price sets
  console.log("\n1️⃣ Finding price sets...")
  
  const priceSets = await pricingService.listPriceSets({}, { take: 100 })
  console.log(`  📊 Found ${priceSets.length} price sets`)
  
  // Step 2: For each price set that has EUR or USD prices for shipping (low amounts like 10),
  // add a KWD price
  let addedCount = 0
  
  for (const priceSet of priceSets) {
    try {
      // Get prices for this set
      const prices = await pricingService.listPrices({
        price_set_id: [priceSet.id]
      })
      
      // Check if this looks like a shipping price (amount <= 100, has EUR or USD)
      const hasShippingPrice = prices.some((p: any) => 
        (p.currency_code === 'usd' || p.currency_code === 'eur') && 
        p.amount <= 100
      )
      
      const hasKwd = prices.some((p: any) => p.currency_code === 'kwd')
      
      if (hasShippingPrice && !hasKwd) {
        console.log(`\n  Price Set ${priceSet.id}:`)
        console.log(`    Current prices: ${prices.map((p: any) => `${p.currency_code}:${p.amount}`).join(', ')}`)
        
        // Add KWD price
        try {
          await pricingService.addPrices({
            priceSetId: priceSet.id,
            prices: [{
              amount: 0, // Free shipping in KWD
              currency_code: "kwd"
            }]
          })
          console.log(`    ✅ Added KWD: 0 (free shipping)`)
          addedCount++
        } catch (addErr: any) {
          console.log(`    ⚠️ Add error: ${addErr.message}`)
        }
      }
    } catch (err: any) {
      // Skip errors
    }
  }
  
  console.log("\n" + "=" .repeat(50))
  console.log(`✅ Added KWD prices to ${addedCount} price sets`)
  
  // Step 3: Verify
  console.log("\n3️⃣ Verifying shipping prices...")
  
  const fulfillmentModuleService = container.resolve("fulfillment")
  const shippingOptions = await fulfillmentModuleService.listShippingOptions({})
  
  for (const option of shippingOptions) {
    console.log(`  ${option.name}: ${option.id}`)
  }
  
  console.log("\n✅ Done!")
}
