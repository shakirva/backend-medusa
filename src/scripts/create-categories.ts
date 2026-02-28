import { ExecArgs } from "@medusajs/framework/types"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

export default async function createCategories({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  logger.info("Creating product categories...")

  const categoryNames = [
    "Smart Phones",
    "Power Banks",
    "Smart Watches",
    "Headphones",
    "Gaming",
    "Laptops",
    "Hot Deals",
    "Mobile & Tablet",
    "Computers & Gaming",
    "Electronics",
    "Home & Kitchen",
    "Fashion",
    "Health & Beauty",
    "Automotives",
    "Toys, Games & Kids",
  ]

  try {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: categoryNames.map((name) => ({ name, is_active: true }))
      }
    })

    logger.info(`Created ${Array.isArray(result) ? result.length : 0} categories.`)
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('Failed to create categories:', err)
    } else {
      logger.error('Failed to create categories:', new Error(String(err)))
    }
    throw err
  }
}
