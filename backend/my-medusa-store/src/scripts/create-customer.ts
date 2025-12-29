import { Modules } from "@medusajs/framework/utils"

export default async function createCustomer({ container }) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  
  console.log("Creating test customer...")
  
  try {
    const customer = await customerModuleService.createCustomers({
      email: "customer@marqasouq.com",
      first_name: "Test",
      last_name: "Customer",
      has_account: true,
    })
    
    console.log(`✅ Customer created: ${customer.email}`)
    console.log(`📧 Email: customer@marqasouq.com`)
    console.log(`🔑 Password: customer123`)
    console.log(`\nYou can now sign in at: http://localhost:8000/account`)
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("ℹ️  Customer already exists!")
      console.log(`📧 Email: customer@marqasouq.com`)
      console.log(`🔑 Password: customer123`)
    } else {
      console.error("❌ Error:", error.message)
    }
  }
}
