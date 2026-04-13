import { ExecArgs } from "@medusajs/framework/types"

/**
 * Add Kuwait to Existing Shipping Zone
 * 
 * This adds Kuwait (KW) to the existing Europe service zone,
 * which already has working shipping options with prices.
 * 
 * Run: npx medusa exec ./src/scripts/add-kuwait-to-shipping-zone.ts
 */

export default async function addKuwaitToShippingZone({ container }: ExecArgs) {
  console.log("\n🌍 Adding Kuwait to Shipping Zone...")
  console.log("=" .repeat(50))
  
  const fulfillmentModuleService = container.resolve("fulfillment")
  
  // Step 1: Find the Europe service zone (which has working shipping)
  console.log("\n1️⃣ Finding existing service zones...")
  
  const serviceZones = await fulfillmentModuleService.listServiceZones({})
  console.log(`  📊 Found ${serviceZones.length} service zones`)
  
  for (const zone of serviceZones) {
    console.log(`  - ${zone.name} (${zone.id})`)
  }
  
  // Find the Europe zone
  const europeZone = serviceZones.find((z: any) => z.name === "Europe")
  
  if (!europeZone) {
    console.log("  ❌ Europe zone not found!")
    return
  }
  
  console.log(`\n2️⃣ Adding Kuwait to ${europeZone.name}...`)
  
  // Get current geo zones for this service zone
  const allGeoZones = await fulfillmentModuleService.listGeoZones({})
  const geoZones = allGeoZones.filter((g: any) => g.service_zone_id === europeZone.id)
  
  console.log(`  📍 Current geo zones: ${geoZones.length}`)
  for (const geo of geoZones) {
    console.log(`    - ${geo.country_code || 'N/A'} (${geo.type})`)
  }
  
  // Check if Kuwait already exists
  const kuwaitExists = geoZones.some((g: any) => g.country_code?.toLowerCase() === 'kw')
  
  if (kuwaitExists) {
    console.log("  ✅ Kuwait already in this zone!")
  } else {
    // Add Kuwait geo zone
    try {
      await fulfillmentModuleService.createGeoZones({
        type: "country",
        country_code: "kw",
        service_zone_id: europeZone.id
      })
      console.log("  ✅ Added Kuwait to Europe zone!")
    } catch (err: any) {
      console.log(`  ⚠️ Error: ${err.message}`)
    }
  }
  
  // Step 3: Check shipping options for this zone
  console.log("\n3️⃣ Checking shipping options...")
  
  const allShippingOptions = await fulfillmentModuleService.listShippingOptions({})
  const shippingOptions = allShippingOptions.filter((o: any) => o.service_zone_id === europeZone.id)
  
  console.log(`  📦 Shipping options in this zone: ${shippingOptions.length}`)
  for (const option of shippingOptions) {
    console.log(`    - ${option.name} (${option.id})`)
  }
  
  // Step 4: Add KWD price to shipping options if not exists
  console.log("\n4️⃣ Checking prices for KWD...")
  
  for (const option of shippingOptions) {
    // Get the full option with prices
    const [fullOption] = await fulfillmentModuleService.listShippingOptions(
      { id: option.id },
      { relations: ["prices"] }
    )
    
    const prices = (fullOption as any).prices || []
    const hasKwd = prices.some((p: any) => p.currency_code === 'kwd')
    
    console.log(`  ${option.name}: ${prices.length} prices, KWD: ${hasKwd ? '✅' : '❌'}`)
    
    if (!hasKwd && prices.length > 0) {
      // Try to add KWD price through update
      console.log(`    Adding KWD price...`)
      try {
        // Get the price set ID from existing price
        const existingPrice = prices[0]
        const priceSetId = existingPrice.price_set_id
        
        if (priceSetId) {
          const pricingService = container.resolve("pricing")
          await pricingService.addPrices({
            priceSetId: priceSetId,
            prices: [{
              amount: 0, // Free shipping
              currency_code: "kwd"
            }]
          })
          console.log(`    ✅ Added KWD price (free shipping)`)
        }
      } catch (priceErr: any) {
        console.log(`    ⚠️ Price error: ${priceErr.message}`)
      }
    }
  }
  
  console.log("\n" + "=" .repeat(50))
  console.log("✅ Kuwait shipping zone setup completed!")
  console.log("\n💡 TIP: Clear cart and add items again to get Kuwait shipping options")
}
