import { ExecArgs } from "@medusajs/framework/types"

export default async function updateBrandOrder({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const brandsModuleService: any = container.resolve("brands");
  
  // List all brands
  const allBrands = await brandsModuleService.listBrands({});
  
  logger.info("📦 All brands in database:");
  allBrands.forEach((b: any) => {
    logger.info(`  - ${b.name} (slug: ${b.slug}, order: ${b.display_order}, id: ${b.id})`);
  });
  
  // Find Apple brand
  const appleBrand = allBrands.find((b: any) => b.slug === "apple" || b.name.toLowerCase() === "apple");
  
  logger.info(`Apple brand found: ${JSON.stringify(appleBrand)}`);
  
  if (appleBrand && appleBrand.id) {
    logger.info(`Updating brand with ID: ${appleBrand.id}`);
    await brandsModuleService.updateBrands({
      id: appleBrand.id,
      display_order: 3
    });
    logger.info("✅ Updated Apple display_order to 3");
  } else {
    logger.info("❌ Apple brand not found, creating it...");
    await brandsModuleService.createBrands({
      name: "Apple",
      slug: "apple",
      description: "Think Different - Premium consumer electronics",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/800px-Apple_logo_black.svg.png",
      is_active: true,
      display_order: 3
    });
    logger.info("✅ Created Apple brand with display_order 3");
  }
  
  // Show final sorted list
  const finalBrands = await brandsModuleService.listBrands({});
  const sorted = finalBrands
    .filter((b: any) => b.is_active)
    .sort((a: any, b: any) => (a.display_order || 99) - (b.display_order || 99))
    .slice(0, 6);
    
  logger.info("\n📦 Top 6 brands by display_order:");
  sorted.forEach((b: any, i: number) => {
    logger.info(`  ${i + 1}. ${b.name} (order: ${b.display_order})`);
  });
}
