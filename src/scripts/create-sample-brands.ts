import { BRAND_MODULE } from "../modules/brands"
import { ExecArgs } from "@medusajs/framework/types"

export default async function seedBrands({ container }: ExecArgs) {
  const brandService = container.resolve(BRAND_MODULE) as any

  const data = [
    {
      name: "Nike",
      slug: "nike",
      description: "Nike, Inc.",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      is_active: true,
      display_order: 1,
    },
    {
      name: "Adidas",
      slug: "adidas",
      description: "Adidas AG",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
      is_active: true,
      display_order: 2,
    },
  ]

  for (const b of data) {
    try {
      await brandService.createBrands(b)
      console.log(`Created brand ${b.name}`)
    } catch (e:any) {
      if (e?.message?.includes("duplicate key") || e?.message?.includes("exists")) {
        console.log(`Brand ${b.name} already exists`)
      } else {
        console.error(`Failed to create ${b.name}:`, e?.message || e)
      }
    }
  }

  console.log("Done.")
}
