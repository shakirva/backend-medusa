import { ExecArgs } from "@medusajs/framework/types"

export default async function fixBrandOrder({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const brandsModuleService: any = container.resolve("brands");
  
  // List all brands
  const allBrands = await brandsModuleService.listBrands({});
  
  logger.info("📦 Current brands:");
  allBrands.forEach((b: any) => {
    logger.info(`  - ${b.name} (slug: ${b.slug}, order: ${b.display_order}, active: ${b.is_active})`);
  });
  
  // Set high display_order for unwanted brands (or deactivate them)
  const unwantedSlugs = ['ssss', 'sony', 'xiaomi'];
  
  for (const slug of unwantedSlugs) {
    const brand = allBrands.find((b: any) => b.slug === slug);
    if (brand && brand.id) {
      await brandsModuleService.updateBrands({
        id: brand.id,
        display_order: 99,  // Put at the end
        is_active: false    // Or deactivate
      });
      logger.info(`✅ Deactivated and moved to end: ${brand.name}`);
    }
  }
  
  // Make sure client brands have correct order and are active
  const clientBrands = [
    { slug: 'powerology', order: 1 },
    { slug: 'samsung', order: 2 },
    { slug: 'apple', order: 3 },
    { slug: 'marshall', order: 4 },
    { slug: 'porodo', order: 5 },
    { slug: 'harman-kardon', order: 6 }
  ];
  
  for (const cb of clientBrands) {
    const brand = allBrands.find((b: any) => b.slug === cb.slug);
    if (brand && brand.id) {
      await brandsModuleService.updateBrands({
        id: brand.id,
        display_order: cb.order,
        is_active: true
      });
      logger.info(`✅ Updated ${brand.name}: order=${cb.order}, active=true`);
    }
  }
  
  // Show final result
  const finalBrands = await brandsModuleService.listBrands({});
  const sorted = finalBrands
    .filter((b: any) => b.is_active)
    .sort((a: any, b: any) => (a.display_order || 99) - (b.display_order || 99))
    .slice(0, 6);
    
  logger.info("\n📦 Top 6 ACTIVE brands by display_order:");
  sorted.forEach((b: any, i: number) => {
    logger.info(`  ${i + 1}. ${b.name} (order: ${b.display_order})`);
  });
}
