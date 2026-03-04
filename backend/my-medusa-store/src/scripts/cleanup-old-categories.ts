/**
 * Cleanup Old Categories Script
 * Removes categories that are not in the approved list
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

// List of approved main category handles (keep these)
const APPROVED_MAIN_CATEGORIES = [
  'mobile-tablet',
  'health-beauty', 
  'electronics',
  'home-kitchen',
  'fashion',
  'offroad',
  'computers-gaming',
  'toys-games-kids',
  'automotives',
  'hot-deals',
];

// Old categories to remove (handles)
const CATEGORIES_TO_REMOVE = [
  'smart-phones',
  'gaming', 
  'headphones',
  'cable',
  'power-banks', // if standalone, should be under mobile-tablet
  'smart-watches', // if standalone, should be under electronics
  'laptops', // if standalone, should be under computers-gaming
];

export default async function cleanupOldCategories({ container }: ExecArgs) {
  const productCategoryService = container.resolve(Modules.PRODUCT);
  const logger = container.resolve("logger");

  logger.info("🧹 Starting cleanup of old categories...\n");

  try {
    // Get all categories
    const allCategories = await productCategoryService.listProductCategories(
      {},
      { take: 500 }
    );

    logger.info(`Found ${allCategories.length} total categories\n`);

    // Find categories to remove (top-level only that are not in approved list)
    const topLevelCategories = allCategories.filter(cat => !cat.parent_category_id);
    
    logger.info(`Top-level categories: ${topLevelCategories.map(c => c.handle).join(', ')}\n`);

    const categoriesToDelete: string[] = [];

    for (const cat of topLevelCategories) {
      if (CATEGORIES_TO_REMOVE.includes(cat.handle)) {
        logger.info(`  ⚠️  Will remove: ${cat.name} (${cat.handle})`);
        categoriesToDelete.push(cat.id);
      }
    }

    if (categoriesToDelete.length === 0) {
      logger.info("\n✅ No old categories to remove. All clean!");
      return;
    }

    logger.info(`\n🗑️  Removing ${categoriesToDelete.length} old categories...\n`);

    // Delete the old categories (this will also delete their children due to cascade)
    for (const catId of categoriesToDelete) {
      try {
        await productCategoryService.deleteProductCategories([catId]);
        logger.info(`  ✓ Deleted category ID: ${catId}`);
      } catch (error: any) {
        logger.warn(`  ⚠️  Could not delete ${catId}: ${error.message}`);
      }
    }

    logger.info("\n✅ Cleanup complete!");

    // Show remaining top-level categories
    const remaining = await productCategoryService.listProductCategories(
      { parent_category_id: null },
      { take: 50 }
    );
    
    logger.info(`\nRemaining main categories (${remaining.length}):`);
    remaining.forEach(cat => {
      logger.info(`  - ${cat.name} (${cat.handle})`);
    });

  } catch (error: unknown) {
    logger.error("Failed to cleanup categories:", error as Error);
    throw error;
  }
}
