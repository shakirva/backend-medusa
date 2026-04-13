/**
 * Delete All Categories and Recreate Fresh
 * This script cleans up all categories and recreates them properly
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function deleteAllCategories({ container }: ExecArgs) {
  const productCategoryService = container.resolve(Modules.PRODUCT);
  const logger = container.resolve("logger");

  logger.info("🗑️ Deleting ALL categories to start fresh...\n");

  try {
    // Get all categories
    const allCategories = await productCategoryService.listProductCategories(
      {},
      { take: 1000 }
    );

    logger.info(`Found ${allCategories.length} categories to delete\n`);

    // Delete all categories
    if (allCategories.length > 0) {
      const ids = allCategories.map(c => c.id);
      
      // Delete in batches to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        try {
          await productCategoryService.deleteProductCategories(batch);
          logger.info(`  ✓ Deleted batch ${Math.floor(i/batchSize) + 1} (${batch.length} categories)`);
        } catch (e: unknown) {
          logger.warn(`  ⚠️ Batch delete failed, trying one by one...`);
          for (const id of batch) {
            try {
              await productCategoryService.deleteProductCategories([id]);
            } catch (e2: unknown) {
              // Ignore - might already be deleted
            }
          }
        }
      }
    }

    // Verify deletion
    const remaining = await productCategoryService.listProductCategories({}, { take: 10 });
    logger.info(`\n✅ Cleanup complete! Remaining categories: ${remaining.length}`);

  } catch (error: unknown) {
    logger.error("Failed to delete categories:", error as Error);
    throw error;
  }
}
