import { ExecArgs } from "@medusajs/framework/types"

/**
 * Fix Kuwait Shipping Price and Links
 * 
 * This script:
 * 1. Adds KWD price to Kuwait shipping option
 * 2. Links Kuwait stock location to sales channel
 * 
 * Run: npx medusa exec ./src/scripts/fix-kuwait-shipping-price.ts
 */

export default async function fixKuwaitShippingPrice({ container }: ExecArgs) {
  console.log("\n💰 Fixing Kuwait Shipping Price...")
  console.log("=" .repeat(50))
  
  const fulfillmentModuleService = container.resolve("fulfillment")
  const stockLocationService = container.resolve("stock_location")
  const salesChannelService = container.resolve("sales_channel")
  const linkService = container.resolve("link")
  
  // Step 1: Find Kuwait shipping option
  console.log("\n1️⃣ Finding Kuwait Shipping Option...")
  
  const shippingOptions = await fulfillmentModuleService.listShippingOptions({
    name: "Kuwait Standard Shipping"
  })
  
  if (shippingOptions.length === 0) {
    console.log("  ❌ Kuwait Standard Shipping not found!")
    return
  }
  
  const kuwaitShipping = shippingOptions[0]
  console.log(`  ✅ Found: ${kuwaitShipping.id}`)
  
  // Step 2: Add/Update price for KWD
  console.log("\n2️⃣ Setting up KWD Price...")
  
  try {
    // Need to add price - use the pricing module
    const pricingService = container.resolve("pricing")
    
    // Create a price set and link it
    const priceSet = await pricingService.createPriceSets({
      prices: [
        {
          amount: 0, // Free shipping
          currency_code: "kwd"
        }
      ]
    })
    
    console.log(`  ✅ Created price set: ${priceSet.id}`)
    
    // Link price to shipping option
    try {
      await linkService.create({
        shipping_option_price_set: {
          shipping_option_id: kuwaitShipping.id,
          price_set_id: priceSet.id
        }
      })
      console.log("  ✅ Linked price to shipping option")
    } catch (linkErr: any) {
      console.log(`  ⚠️ Link error: ${linkErr.message}`)
    }
  } catch (err: any) {
    console.log(`  ⚠️ Price setup: ${err.message}`)
  }
  
  // Step 3: Link Kuwait stock location to sales channel
  console.log("\n3️⃣ Linking Stock Location to Sales Channel...")
  
  try {
    const kuwaitLocations = await stockLocationService.listStockLocations({
      name: "Kuwait Warehouse"
    })
    
    if (kuwaitLocations.length === 0) {
      console.log("  ⚠️ Kuwait Warehouse not found")
      return
    }
    
    const kuwaitLocation = kuwaitLocations[0]
    console.log(`  📍 Kuwait Warehouse: ${kuwaitLocation.id}`)
    
    const salesChannels = await salesChannelService.listSalesChannels({})
    const defaultChannel = salesChannels[0]
    
    if (defaultChannel) {
      console.log(`  📢 Sales Channel: ${defaultChannel.name} (${defaultChannel.id})`)
      
      // Link stock location to sales channel
      try {
        await linkService.create({
          sales_channel_stock_location: {
            sales_channel_id: defaultChannel.id,
            stock_location_id: kuwaitLocation.id
          }
        })
        console.log("  ✅ Linked Kuwait Warehouse to Sales Channel")
      } catch (linkErr: any) {
        if (linkErr.message?.includes("already exists") || linkErr.message?.includes("duplicate")) {
          console.log("  ✅ Link already exists")
        } else {
          console.log(`  ⚠️ Link error: ${linkErr.message}`)
        }
      }
    }
  } catch (err: any) {
    console.log(`  ⚠️ Stock location linking: ${err.message}`)
  }
  
  // Step 4: Link fulfillment set to stock location
  console.log("\n4️⃣ Linking Fulfillment Set to Stock Location...")
  
  try {
    const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
      name: "Kuwait Fulfillment"
    })
    
    const kuwaitLocations = await stockLocationService.listStockLocations({
      name: "Kuwait Warehouse"
    })
    
    if (fulfillmentSets.length > 0 && kuwaitLocations.length > 0) {
      const fulfillmentSet = fulfillmentSets[0]
      const location = kuwaitLocations[0]
      
      try {
        await linkService.create({
          stock_location_fulfillment_set: {
            stock_location_id: location.id,
            fulfillment_set_id: fulfillmentSet.id
          }
        })
        console.log("  ✅ Linked Fulfillment Set to Stock Location")
      } catch (linkErr: any) {
        if (linkErr.message?.includes("already exists") || linkErr.message?.includes("duplicate")) {
          console.log("  ✅ Link already exists")
        } else {
          console.log(`  ⚠️ Link error: ${linkErr.message}`)
        }
      }
    }
  } catch (err: any) {
    console.log(`  ⚠️ Fulfillment linking: ${err.message}`)
  }
  
  console.log("\n" + "=" .repeat(50))
  console.log("✅ Kuwait shipping price and links setup completed!")
}
