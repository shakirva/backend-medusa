import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"
import { createHash } from "crypto"

export default async function fixCustomerAuth({ container }: ExecArgs) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const authModuleService = container.resolve(Modules.AUTH)
  
  const email = "customer@example.com"
  const password = "password123"
  
  console.log("🔧 Fixing customer auth identity...")
  
  try {
    // 1. Find or create the customer
    let customer
    const existingCustomers = await customerModuleService.listCustomers({ email })
    
    if (existingCustomers.length > 0) {
      customer = existingCustomers[0]
      console.log(`✅ Found existing customer: ${customer.id}`)
    } else {
      customer = await customerModuleService.createCustomers({
        email,
        first_name: "Test",
        last_name: "Customer",
        has_account: true,
      })
      console.log(`✅ Created customer: ${customer.id}`)
    }
    
    // 2. Check if auth identity exists
    const authIdentities = await authModuleService.listAuthIdentities({
      provider_identities: {
        entity_id: email,
        provider: "emailpass"
      }
    })
    
    if (authIdentities.length > 0) {
      console.log(`ℹ️  Auth identity already exists for ${email}`)
      
      // Update the provider identity to link to customer
      const authIdentity = authIdentities[0]
      const providerIdentity = authIdentity.provider_identities?.find(
        (pi: any) => pi.provider === "emailpass"
      )
      
      if (providerIdentity) {
        // Hash password
        const hashedPassword = createHash("sha256").update(password).digest("hex")
        
        await authModuleService.updateProviderIdentities([{
          id: providerIdentity.id,
          provider_metadata: {
            password: hashedPassword
          }
        }])
        console.log(`✅ Updated auth identity password`)
      }
      
      // Link auth identity to customer if not linked
      if (!authIdentity.app_metadata?.customer_id) {
        await authModuleService.updateAuthIdentities([{
          id: authIdentity.id,
          app_metadata: {
            customer_id: customer.id
          }
        }])
        console.log(`✅ Linked auth identity to customer`)
      }
    } else {
      // Create new auth identity with proper password hash
      const hashedPassword = createHash("sha256").update(password).digest("hex")
      
      const authIdentity = await authModuleService.createAuthIdentities({
        provider_identities: [{
          entity_id: email,
          provider: "emailpass",
          provider_metadata: {
            password: hashedPassword
          }
        }],
        app_metadata: {
          customer_id: customer.id
        }
      })
      console.log(`✅ Created auth identity: ${authIdentity.id}`)
    }
    
    console.log(`\n🎉 Customer auth fixed!`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`\nNow try logging in via POST /auth/customer/emailpass`)
    
  } catch (error: unknown) {
    console.error("❌ Error:", error)
  }
}
