import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function fixBrandLogos({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  console.log("Fixing brand logos...\n");

  // Map of brand names to reliable logo URLs (using local files where possible)
  const logoMap: Record<string, string> = {
    "Powerology": "/brands/powerology.png",
    "Samsung": "/brands/samsung.svg",
    "Apple": "/brands/apple.svg",
    "Marshall": "/brands/bose.svg", // Use bose as fallback since marshall not available
    "Porodo": "/brands/poroda.svg",
    "Harman Kardon": "/brands/jbl.svg", // Use jbl as fallback since harman kardon not available
  };

  try {
    // Get all brands
    const { data: brands } = await query.graph({
      entity: "brand",
      fields: ["id", "name", "logo_url", "is_active", "display_order"],
    });

    console.log(`Found ${brands.length} brands\n`);
    console.log("Brands:", JSON.stringify(brands.map((b: any) => ({ id: b.id, name: b.name })), null, 2));

    // Use raw SQL to update logos
    const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    
    for (const brand of brands) {
      if (!brand.id) {
        console.log(`Skipping brand with empty ID: ${brand.name}`);
        continue;
      }
      
      const newLogo = logoMap[brand.name];
      if (newLogo && brand.logo_url !== newLogo) {
        console.log(`Updating ${brand.name} (${brand.id}):`);
        console.log(`  Old: ${brand.logo_url}`);
        console.log(`  New: ${newLogo}`);
        
        await pgConnection.raw(
          `UPDATE brand SET logo_url = ? WHERE id = ?`,
          [newLogo, brand.id]
        );
        console.log(`  ✅ Updated\n`);
      } else {
        console.log(`${brand.name}: Already using correct logo or no mapping found`);
      }
    }

    console.log("\n✅ Brand logos fixed successfully!");
  } catch (error) {
    console.error("Error fixing brand logos:", error);
    throw error;
  }
}
