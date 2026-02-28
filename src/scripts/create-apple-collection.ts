import { ExecArgs, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function createAppleCollection({ container }: ExecArgs) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  console.log("Creating Apple collection...")

  try {
    // Check if collection already exists
    const existingCollections = await productService.listProductCollections({
      handle: "apple"
    })

    if (existingCollections.length > 0) {
      console.log("Apple collection already exists:", existingCollections[0].id)
      return
    }

    // Create the Apple collection
    const collection = await productService.createProductCollections({
      title: "Apple",
      handle: "apple",
      metadata: {
        brand: "Apple",
        featured: true,
        description: "Apple products - Pioneering Technology"
      }
    })

    console.log("✅ Apple collection created successfully!")
    console.log("Collection ID:", collection.id)
    console.log("Collection Handle:", collection.handle)
    console.log("")
    console.log("📝 Next steps:")
    console.log("1. Go to Medusa Admin → Products → Collections")
    console.log("2. Find the 'Apple' collection")
    console.log("3. Add Apple products to this collection")
    console.log("4. The products will appear in the 'PIONEERING TECHNOLOGY' section on the homepage")

  } catch (error: any) {
    console.error("Error creating Apple collection:", error.message)
  }
}
