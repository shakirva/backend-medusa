import Medusa from "@medusajs/js-sdk";

const client = new Medusa({
  baseUrl: "http://localhost:9000",
  publishableKey: "pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b",
});

interface ProductIssue {
  id: string;
  title: string;
  handle: string;
}

async function checkProductQuality() {
  try {
    const { products, count } = await client.store.product.list({ 
      limit: 500,
      region_id: "reg_01KFYZNTFQ4AGNEVR15206N3GN"
    });
    
    console.log("Total products:", count);
    console.log("Checking product quality...\n");
    
    const issues = {
      noTitle: [] as ProductIssue[],
      noPrice: [] as ProductIssue[],
      noImage: [] as ProductIssue[],
      noVariants: [] as ProductIssue[],
      noDescription: [] as ProductIssue[],
    };
    
    for (const p of products || []) {
      const info = { id: p.id, title: p.title || "(no title)", handle: p.handle || "" };
      
      // Check for missing title
      if (!p.title || p.title.trim() === "") {
        issues.noTitle.push(info);
      }
      
      // Check for missing images
      if (!p.thumbnail && (!p.images || p.images.length === 0)) {
        issues.noImage.push(info);
      }
      
      // Check for no variants
      if (!p.variants || p.variants.length === 0) {
        issues.noVariants.push(info);
      } else {
        // Check for missing price
        const hasPrice = p.variants.some((v: any) => {
          return v.calculated_price && 
                 v.calculated_price.calculated_amount !== null && 
                 v.calculated_price.calculated_amount > 0;
        });
        if (!hasPrice) {
          issues.noPrice.push(info);
        }
      }
      
      // Check for missing description
      if (!p.description || p.description.trim() === "") {
        issues.noDescription.push(info);
      }
    }
    
    console.log("=== PRODUCT QUALITY REPORT ===\n");
    console.log(`Total products analyzed: ${products?.length || 0}`);
    console.log("\n--- Issues Found ---");
    console.log(`❌ No title: ${issues.noTitle.length}`);
    console.log(`❌ No image: ${issues.noImage.length}`);
    console.log(`❌ No price: ${issues.noPrice.length}`);
    console.log(`❌ No variants: ${issues.noVariants.length}`);
    console.log(`⚠️  No description: ${issues.noDescription.length}`);
    
    // List products without images (critical for display)
    if (issues.noImage.length > 0) {
      console.log("\n--- Products Without Images ---");
      issues.noImage.slice(0, 20).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.handle})`);
      });
      if (issues.noImage.length > 20) {
        console.log(`  ... and ${issues.noImage.length - 20} more`);
      }
    }
    
    // List products without price (critical for checkout)
    if (issues.noPrice.length > 0) {
      console.log("\n--- Products Without Price ---");
      issues.noPrice.slice(0, 20).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.handle})`);
      });
      if (issues.noPrice.length > 20) {
        console.log(`  ... and ${issues.noPrice.length - 20} more`);
      }
    }
    
    // Summary
    const goodProducts = (products?.length || 0) - issues.noImage.length - issues.noPrice.length - issues.noVariants.length;
    console.log("\n=== SUMMARY ===");
    console.log(`✅ Complete products (with image, price, variants): ${goodProducts}`);
    console.log(`❌ Products needing attention: ${issues.noImage.length + issues.noPrice.length + issues.noVariants.length}`);
    
    return {
      total: products?.length || 0,
      issues,
      goodProducts
    };
    
  } catch (e: any) {
    console.error("Error checking products:", e.message);
    throw e;
  }
}

checkProductQuality()
  .then((result) => {
    console.log("\nProduct quality check completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
