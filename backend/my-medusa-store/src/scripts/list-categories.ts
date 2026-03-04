/**
 * List All Categories Script
 * Shows all categories with their hierarchy
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function listCategories({ container }: ExecArgs) {
  const productCategoryService = container.resolve(Modules.PRODUCT);
  const logger = container.resolve("logger");

  logger.info("📋 Listing all categories...\n");

  try {
    // Get all categories
    const allCategories = await productCategoryService.listProductCategories(
      {},
      { take: 500 }
    );

    logger.info(`Total categories: ${allCategories.length}\n`);

    // Find top-level categories (no parent)
    const topLevel = allCategories.filter(cat => !cat.parent_category_id);
    
    logger.info(`\n🔝 Top-level categories (${topLevel.length}):\n`);
    topLevel.forEach(cat => {
      logger.info(`  - ${cat.name} | handle: "${cat.handle}" | id: ${cat.id}`);
    });

    // Show ones that might be duplicates or old
    const oldHandles = ['smart-phones', 'gaming', 'headphones', 'cable', 'power-banks', 'smart-watches', 'laptops'];
    const oldCats = allCategories.filter(cat => oldHandles.includes(cat.handle) && !cat.parent_category_id);
    
    if (oldCats.length > 0) {
      logger.info(`\n⚠️ Old/Unwanted top-level categories found:\n`);
      oldCats.forEach(cat => {
        logger.info(`  - ${cat.name} | handle: "${cat.handle}" | id: ${cat.id}`);
      });
    }

  } catch (error: unknown) {
    logger.error("Failed to list categories:", error as Error);
    throw error;
  }
}
