import { ExecArgs } from "@medusajs/framework/types"

/**
 * Setup Kuwait Shipping
 * 
 * This script creates the necessary fulfillment and shipping configuration
 * for Kuwait region orders.
 * 
 * Run: npx medusa exec ./src/scripts/setup-kuwait-shipping.ts
 */

export default async function setupKuwaitShipping({ container }: ExecArgs) {
  console.log("\n🚚 Setting up Kuwait Shipping...")
  console.log("=" .repeat(50))
  
  const regionService = container.resolve("region")
  const stockLocationService = container.resolve("stock_location")
  const fulfillmentModuleService = container.resolve("fulfillment")
  const linkService = container.resolve("link")
  
  // Step 1: Find or create Kuwait stock location
  console.log("\n1️⃣ Setting up Kuwait Stock Location...")
  
  let kuwaitLocation
  const existingLocations = await stockLocationService.listStockLocations({ name: "Kuwait Warehouse" })
  
  if (existingLocations.length > 0) {
    kuwaitLocation = existingLocations[0]
    console.log(`  ✅ Found existing Kuwait Warehouse: ${kuwaitLocation.id}`)
  } else {
    kuwaitLocation = await stockLocationService.createStockLocations({
      name: "Kuwait Warehouse",
      address: {
        address_1: "Kuwait City",
        city: "Kuwait City",
        country_code: "kw",
        postal_code: "12345"
      }
    })
    console.log(`  ✅ Created Kuwait Warehouse: ${kuwaitLocation.id}`)
  }
  
  // Step 2: Find Kuwait region
  console.log("\n2️⃣ Finding Kuwait Region...")
  
  const regions = await regionService.listRegions({})
  const kuwaitRegion = regions.find((r: any) => 
    r.name?.toLowerCase().includes('kuwait') || 
    r.countries?.some((c: any) => c.iso_2?.toLowerCase() === 'kw')
  )
  
  if (!kuwaitRegion) {
    console.error("  ❌ Kuwait region not found!")
    return
  }
  console.log(`  ✅ Found Kuwait Region: ${kuwaitRegion.id} (${kuwaitRegion.name})`)
  
  // Step 3: Create fulfillment set for Kuwait
  console.log("\n3️⃣ Setting up Fulfillment Set for Kuwait...")
  
  let kuwaitFulfillmentSet
  try {
    // Check if fulfillment set exists
    const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
      name: "Kuwait Fulfillment"
    })
    
    if (fulfillmentSets.length > 0) {
      kuwaitFulfillmentSet = fulfillmentSets[0]
      console.log(`  ✅ Found existing Kuwait Fulfillment Set: ${kuwaitFulfillmentSet.id}`)
    } else {
      kuwaitFulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
        name: "Kuwait Fulfillment",
        type: "shipping"
      })
      console.log(`  ✅ Created Kuwait Fulfillment Set: ${kuwaitFulfillmentSet.id}`)
    }
  } catch (err: any) {
    console.log(`  ⚠️ Fulfillment set error: ${err.message}`)
  }
  
  // Step 4: Create service zone for Kuwait
  console.log("\n4️⃣ Setting up Service Zone for Kuwait...")
  
  let kuwaitServiceZone
  try {
    const serviceZones = await fulfillmentModuleService.listServiceZones({
      name: "Kuwait Zone"
    })
    
    if (serviceZones.length > 0) {
      kuwaitServiceZone = serviceZones[0]
      console.log(`  ✅ Found existing Kuwait Zone: ${kuwaitServiceZone.id}`)
    } else if (kuwaitFulfillmentSet) {
      kuwaitServiceZone = await fulfillmentModuleService.createServiceZones({
        name: "Kuwait Zone",
        fulfillment_set_id: kuwaitFulfillmentSet.id,
        geo_zones: [{
          type: "country",
          country_code: "kw"
        }]
      })
      console.log(`  ✅ Created Kuwait Zone: ${kuwaitServiceZone.id}`)
    }
  } catch (err: any) {
    console.log(`  ⚠️ Service zone error: ${err.message}`)
  }
  
  // Step 5: Create shipping option for Kuwait
  console.log("\n5️⃣ Setting up Shipping Option for Kuwait...")
  
  try {
    // Get shipping profile
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({})
    const defaultProfile = shippingProfiles.find((p: any) => p.type === 'default') || shippingProfiles[0]
    
    if (!defaultProfile) {
      console.log("  ⚠️ No shipping profile found")
      return
    }
    
    // Check for existing Kuwait shipping option
    const existingOptions = await fulfillmentModuleService.listShippingOptions({
      name: "Kuwait Standard Shipping"
    })
    
    if (existingOptions.length > 0) {
      console.log(`  ✅ Found existing Kuwait Standard Shipping: ${existingOptions[0].id}`)
    } else if (kuwaitServiceZone) {
      // Create shipping option
      const shippingOption = await fulfillmentModuleService.createShippingOptions({
        name: "Kuwait Standard Shipping",
        price_type: "flat",
        service_zone_id: kuwaitServiceZone.id,
        shipping_profile_id: defaultProfile.id,
        provider_id: "manual_manual",
        type: {
          label: "Standard",
          description: "Standard shipping to Kuwait (2-3 days)",
          code: "standard"
        },
        rules: [
          {
            attribute: "enabled_in_store",
            operator: "eq",
            value: "true"
          },
          {
            attribute: "is_return",
            operator: "eq",
            value: "false"
          }
        ]
      })
      console.log(`  ✅ Created Kuwait Standard Shipping: ${shippingOption.id}`)
      
      // Add price for KWD
      try {
        const pricingService = container.resolve("pricing")
        await pricingService.createPriceSets({
          prices: [{
            amount: 0, // Free shipping
            currency_code: "kwd"
          }]
        })
        console.log("  ✅ Added KWD pricing (Free Shipping)")
      } catch (priceErr: any) {
        console.log(`  ⚠️ Pricing: ${priceErr.message}`)
      }
    }
  } catch (err: any) {
    console.log(`  ⚠️ Shipping option error: ${err.message}`)
  }
  
  // Step 6: Link stock location to fulfillment
  console.log("\n6️⃣ Linking Stock Location to Fulfillment...")
  
  try {
    if (kuwaitFulfillmentSet && kuwaitLocation) {
      await linkService.create({
        fulfillment_set_stock_location: {
          fulfillment_set_id: kuwaitFulfillmentSet.id,
          stock_location_id: kuwaitLocation.id
        }
      })
      console.log("  ✅ Linked Kuwait Warehouse to Fulfillment Set")
    }
  } catch (err: any) {
    console.log(`  ⚠️ Link error (may already exist): ${err.message}`)
  }
  
  // Summary
  console.log("\n" + "=" .repeat(50))
  console.log("📊 KUWAIT SHIPPING SETUP SUMMARY")
  console.log("=" .repeat(50))
  console.log(`📍 Stock Location: ${kuwaitLocation?.id || 'N/A'}`)
  console.log(`🌍 Region: ${kuwaitRegion?.id || 'N/A'}`)
  console.log(`📦 Fulfillment Set: ${kuwaitFulfillmentSet?.id || 'N/A'}`)
  console.log(`🗺️  Service Zone: ${kuwaitServiceZone?.id || 'N/A'}`)
  console.log("\n✅ Kuwait shipping setup completed!")
}
