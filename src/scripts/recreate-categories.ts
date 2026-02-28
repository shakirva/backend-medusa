/**
 * Force Delete and Recreate All Categories
 * Uses direct database queries to ensure clean slate
 */

import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

// Complete category tree
const CATEGORIES = [
  // Mobile & Tablet
  { name: "Mobile & Tablet", handle: "mobile-tablet", parent: null },
  { name: "Mobiles", handle: "mobiles", parent: "mobile-tablet" },
  { name: "iPhone", handle: "iphone", parent: "mobiles" },
  { name: "Samsung", handle: "samsung-mobiles", parent: "mobiles" },
  { name: "Asus ROG", handle: "asus-rog", parent: "mobiles" },
  { name: "One Plus", handle: "one-plus", parent: "mobiles" },
  { name: "Nothing Technology", handle: "nothing-technology", parent: "mobiles" },
  { name: "Vivo", handle: "vivo", parent: "mobiles" },
  { name: "Oppo", handle: "oppo", parent: "mobiles" },
  { name: "Tablets", handle: "tablets", parent: "mobile-tablet" },
  { name: "Lenovo", handle: "lenovo-tablets", parent: "tablets" },
  { name: "Amazon", handle: "amazon-tablets", parent: "tablets" },
  { name: "Apple", handle: "apple-tablets", parent: "tablets" },
  { name: "Green Lion", handle: "green-lion-tablets", parent: "tablets" },
  { name: "Huawei", handle: "huawei-tablets", parent: "tablets" },
  { name: "Samsung", handle: "samsung-tablets", parent: "tablets" },
  { name: "Mobile Accessories", handle: "mobile-accessories", parent: "mobile-tablet" },
  { name: "Lanyard", handle: "lanyard", parent: "mobile-accessories" },
  { name: "Mobile Cases", handle: "mobile-cases", parent: "mobile-accessories" },
  { name: "Screen Protectors", handle: "screen-protectors", parent: "mobile-accessories" },
  { name: "OTG Adapter", handle: "otg-adapter", parent: "mobile-accessories" },
  { name: "Mobile Charger", handle: "mobile-charger", parent: "mobile-accessories" },
  { name: "Holder", handle: "mobile-holder", parent: "mobile-accessories" },
  { name: "Screen Cleaners", handle: "screen-cleaners", parent: "mobile-accessories" },
  { name: "Phone Cooler", handle: "phone-cooler", parent: "mobile-accessories" },
  { name: "Charging Cables", handle: "charging-cables", parent: "mobile-accessories" },
  { name: "IQOS Cases", handle: "iqos-cases", parent: "mobile-accessories" },
  { name: "Lenses", handle: "mobile-lenses", parent: "mobile-accessories" },
  { name: "Lens Protectors", handle: "lens-protectors", parent: "mobile-accessories" },
  { name: "UV Phone Steriliser Boxes", handle: "uv-phone-steriliser-boxes", parent: "mobile-accessories" },
  { name: "Holders, Grips & Stands", handle: "holders-grips-stands", parent: "mobile-accessories" },
  { name: "Smart Tag", handle: "smart-tag", parent: "mobile-accessories" },
  { name: "Styluses & Pens", handle: "styluses-pens", parent: "mobile-accessories" },
  { name: "Tablet Accessories", handle: "tablet-accessories", parent: "mobile-tablet" },
  { name: "Tablet Cases", handle: "tablet-cases", parent: "tablet-accessories" },
  { name: "Tablet Screen Protector", handle: "tablet-screen-protector", parent: "tablet-accessories" },
  { name: "Tablet Stands", handle: "tablet-stands", parent: "tablet-accessories" },
  { name: "Tablet Keyboards", handle: "tablet-keyboards", parent: "tablet-accessories" },
  { name: "Power Banks", handle: "power-banks", parent: "mobile-tablet" },
  { name: "Under 10K mAh", handle: "power-banks-under-10k", parent: "power-banks" },
  { name: "10-20K mAh", handle: "power-banks-10-20k", parent: "power-banks" },
  { name: "21-30K mAh", handle: "power-banks-21-30k", parent: "power-banks" },
  { name: "Over 31000mAh", handle: "power-banks-over-31k", parent: "power-banks" },
  { name: "Power Station", handle: "power-station", parent: "mobile-tablet" },

  // Health & Beauty
  { name: "Health & Beauty", handle: "health-beauty", parent: null },
  { name: "Beauty & Cosmetics", handle: "beauty-cosmetics", parent: "health-beauty" },
  { name: "Make-Up Organizer", handle: "makeup-organizer", parent: "beauty-cosmetics" },
  { name: "Makeup Mirrors", handle: "makeup-mirrors", parent: "beauty-cosmetics" },
  { name: "Fragrances & Perfumes", handle: "fragrances-perfumes", parent: "beauty-cosmetics" },
  { name: "Manicure & Pedicure", handle: "manicure-pedicure", parent: "beauty-cosmetics" },
  { name: "Hair Styling", handle: "hair-styling", parent: "beauty-cosmetics" },
  { name: "Shavers & Hair Removal", handle: "shavers-hair-removal", parent: "health-beauty" },
  { name: "Shavers and Trimmers", handle: "shavers-trimmers", parent: "shavers-hair-removal" },
  { name: "Hair Remover", handle: "hair-remover", parent: "shavers-hair-removal" },
  { name: "Health", handle: "health", parent: "health-beauty" },
  { name: "Ring", handle: "health-ring", parent: "health" },
  { name: "Medical Care", handle: "medical-care", parent: "health" },
  { name: "Face Masks & Shields", handle: "face-masks-shields", parent: "health" },
  { name: "Massage & Relaxation", handle: "massage-relaxation", parent: "health" },
  { name: "Baby Care", handle: "baby-care", parent: "health" },
  { name: "Health & Skin Care", handle: "health-skin-care", parent: "health" },
  { name: "Dental Care", handle: "dental-care", parent: "health" },
  { name: "Fitness", handle: "fitness", parent: "health-beauty" },
  { name: "Health & Fitness Equipments", handle: "fitness-equipments", parent: "fitness" },
  { name: "Smart Body Scales", handle: "smart-body-scales", parent: "fitness" },

  // Electronics
  { name: "Electronics", handle: "electronics", parent: null },
  { name: "Watches", handle: "watches", parent: "electronics" },
  { name: "Kids' Smart Watches", handle: "kids-smart-watches", parent: "watches" },
  { name: "Smart Bands", handle: "smart-bands", parent: "watches" },
  { name: "Smart Watches", handle: "smart-watches", parent: "watches" },
  { name: "Watch Accessories", handle: "watch-accessories", parent: "electronics" },
  { name: "Bands & Straps", handle: "bands-straps", parent: "watch-accessories" },
  { name: "Watch Screen Protectors", handle: "watch-screen-protectors", parent: "watch-accessories" },
  { name: "Cases & Covers", handle: "watch-cases-covers", parent: "watch-accessories" },
  { name: "Smart Watch Chargers", handle: "smart-watch-chargers", parent: "watch-accessories" },
  { name: "Speakers & Accessories", handle: "speakers-accessories", parent: "electronics" },
  { name: "Bluetooth Speakers", handle: "bluetooth-speakers", parent: "speakers-accessories" },
  { name: "AUX Cables", handle: "aux-cables", parent: "speakers-accessories" },
  { name: "Speaker Cases & Covers", handle: "speaker-cases-covers", parent: "speakers-accessories" },
  { name: "Home Speakers & Soundbars", handle: "home-speakers-soundbars", parent: "speakers-accessories" },
  { name: "Earphones & Headphones", handle: "earphones-headphones", parent: "electronics" },
  { name: "Kids' Headphones", handle: "kids-headphones", parent: "earphones-headphones" },
  { name: "On-Ear Headphones", handle: "on-ear-headphones", parent: "earphones-headphones" },
  { name: "Open-Ear Headphones", handle: "open-ear-headphones", parent: "earphones-headphones" },
  { name: "Over-Ear Headphones", handle: "over-ear-headphones", parent: "earphones-headphones" },
  { name: "Earbuds", handle: "earbuds", parent: "earphones-headphones" },
  { name: "Earbuds Accessories", handle: "earbuds-accessories", parent: "earphones-headphones" },
  { name: "Earphones", handle: "earphones", parent: "earphones-headphones" },
  { name: "Microphones", handle: "microphones", parent: "earphones-headphones" },
  { name: "Cameras", handle: "cameras", parent: "electronics" },
  { name: "Digital Cameras", handle: "digital-cameras", parent: "cameras" },
  { name: "DSLR Cameras", handle: "dslr-cameras", parent: "cameras" },
  { name: "Mirrorless Cameras", handle: "mirrorless-cameras", parent: "cameras" },
  { name: "Action Cameras", handle: "action-cameras", parent: "cameras" },
  { name: "Security Cameras", handle: "security-cameras", parent: "cameras" },
  { name: "Drones", handle: "drones", parent: "cameras" },
  { name: "Binoculars", handle: "binoculars", parent: "cameras" },
  { name: "Tripods", handle: "tripods", parent: "cameras" },
  { name: "Camera Accessories", handle: "camera-accessories", parent: "cameras" },
  { name: "Gimbals", handle: "gimbals", parent: "cameras" },
  { name: "Instant Photo Printers", handle: "instant-photo-printers", parent: "cameras" },
  { name: "Printers & Scanners", handle: "printers-scanners", parent: "electronics" },
  { name: "Printers", handle: "printers", parent: "printers-scanners" },
  { name: "Scanners", handle: "scanners", parent: "printers-scanners" },
  { name: "Printer Cartridges & Inks", handle: "printer-cartridges-inks", parent: "printers-scanners" },
  { name: "Televisions", handle: "televisions", parent: "electronics" },
  { name: "Powerology", handle: "powerology", parent: "electronics" },
  { name: "Others", handle: "electronics-others", parent: "electronics" },
  { name: "Glasses & Accessories", handle: "glasses-accessories", parent: "electronics" },
  { name: "Streaming Devices", handle: "streaming-devices", parent: "electronics" },
  { name: "Projectors", handle: "projectors", parent: "electronics" },

  // Home & Kitchen
  { name: "Home & Kitchen", handle: "home-kitchen", parent: null },
  { name: "Home", handle: "home", parent: "home-kitchen" },
  { name: "Electric Mosquito Killers", handle: "electric-mosquito-killers", parent: "home" },
  { name: "Refrigerators", handle: "refrigerators", parent: "home" },
  { name: "Portable Fridges", handle: "portable-fridges", parent: "refrigerators" },
  { name: "Mini Fridges", handle: "mini-fridges", parent: "refrigerators" },
  { name: "Ice Makers", handle: "ice-makers", parent: "refrigerators" },
  { name: "Cleaning", handle: "cleaning", parent: "home" },
  { name: "Washers & Dryers", handle: "washers-dryers", parent: "cleaning" },
  { name: "Vacuum and Cleaners", handle: "vacuum-cleaners", parent: "cleaning" },
  { name: "Jet Fan & Blower", handle: "jet-fan-blower", parent: "cleaning" },
  { name: "Irons & Steamers", handle: "irons-steamers", parent: "cleaning" },
  { name: "Bakhour", handle: "bakhour", parent: "home" },
  { name: "Aroma Diffusers", handle: "aroma-diffusers", parent: "home" },
  { name: "Air Conditioning", handle: "air-conditioning", parent: "home" },
  { name: "Portable Fan", handle: "portable-fan", parent: "air-conditioning" },
  { name: "Air Coolers", handle: "air-coolers", parent: "air-conditioning" },
  { name: "Air Purifiers", handle: "air-purifiers", parent: "air-conditioning" },
  { name: "Smart Home", handle: "smart-home", parent: "home" },
  { name: "Pet Supplies", handle: "pet-supplies", parent: "home" },
  { name: "Lightings", handle: "lightings", parent: "home" },
  { name: "Tools", handle: "tools", parent: "home" },
  { name: "Kitchen", handle: "kitchen", parent: "home-kitchen" },
  { name: "Kitchen Appliances", handle: "kitchen-appliances", parent: "kitchen" },
  { name: "Grill & Toaster", handle: "grill-toaster", parent: "kitchen-appliances" },
  { name: "Water Dispenser", handle: "water-dispenser", parent: "kitchen-appliances" },
  { name: "Blenders, Juicers & Mixers", handle: "blenders-juicers-mixers", parent: "kitchen-appliances" },
  { name: "Food Weighing Scales", handle: "food-weighing-scales", parent: "kitchen-appliances" },
  { name: "Choppers", handle: "choppers", parent: "kitchen-appliances" },
  { name: "Electric Pressure Cooker", handle: "electric-pressure-cooker", parent: "kitchen-appliances" },
  { name: "Thermal Mugs & Bottles", handle: "thermal-mugs-bottles", parent: "kitchen-appliances" },
  { name: "Kettle", handle: "kettle", parent: "kitchen-appliances" },
  { name: "Air Fryers", handle: "air-fryers", parent: "kitchen-appliances" },
  { name: "Vacuum Sealers", handle: "vacuum-sealers", parent: "kitchen-appliances" },
  { name: "Coffee, Tea & Espresso", handle: "coffee-tea-espresso", parent: "kitchen" },
  { name: "Espresso Machines", handle: "espresso-machines", parent: "coffee-tea-espresso" },
  { name: "Coffee Brewers", handle: "coffee-brewers", parent: "coffee-tea-espresso" },
  { name: "Portable Coffee Maker", handle: "portable-coffee-maker", parent: "coffee-tea-espresso" },
  { name: "Grinder", handle: "grinder", parent: "coffee-tea-espresso" },
  { name: "Milk Frother", handle: "milk-frother", parent: "coffee-tea-espresso" },
  { name: "Equipment", handle: "coffee-equipment", parent: "coffee-tea-espresso" },
  { name: "Office", handle: "office", parent: "home-kitchen" },
  { name: "Presenter", handle: "presenter", parent: "office" },
  { name: "Smart Sockets", handle: "smart-sockets", parent: "office" },
  { name: "Extension Power Sockets", handle: "extension-power-sockets", parent: "office" },
  { name: "Batteries", handle: "batteries", parent: "office" },
  { name: "Stationery", handle: "stationery", parent: "office" },

  // Fashion
  { name: "Fashion", handle: "fashion", parent: null },
  { name: "Luggages & Accessories", handle: "luggages-accessories", parent: "fashion" },
  { name: "Luggage", handle: "luggage", parent: "luggages-accessories" },
  { name: "Travel Accessories", handle: "travel-accessories", parent: "luggages-accessories" },
  { name: "Bags", handle: "bags", parent: "fashion" },
  { name: "Backpacks", handle: "backpacks", parent: "bags" },
  { name: "Bags & Wallets", handle: "bags-wallets", parent: "bags" },

  // Offroad
  { name: "Offroad", handle: "offroad", parent: null },
  { name: "Camping Essentials", handle: "camping-essentials", parent: "offroad" },
  { name: "Chair & Table", handle: "chair-table", parent: "camping-essentials" },
  { name: "Bidet", handle: "bidet", parent: "camping-essentials" },
  { name: "Other Camping Accessories", handle: "other-camping-accessories", parent: "camping-essentials" },
  { name: "Sleeping Gear & Shelter", handle: "sleeping-gear-shelter", parent: "offroad" },
  { name: "Mattress", handle: "mattress", parent: "sleeping-gear-shelter" },
  { name: "Tent", handle: "tent", parent: "sleeping-gear-shelter" },
  { name: "Communication & Power Solutions", handle: "communication-power-solutions", parent: "offroad" },
  { name: "Radio Communication Devices", handle: "radio-communication-devices", parent: "communication-power-solutions" },
  { name: "Power Generators", handle: "power-generators", parent: "communication-power-solutions" },
  { name: "Camp Cooking & Lighting", handle: "camp-cooking-lighting", parent: "offroad" },
  { name: "Lights", handle: "camping-lights", parent: "camp-cooking-lighting" },
  { name: "Stove & Grill", handle: "stove-grill", parent: "camp-cooking-lighting" },

  // Computers & Gaming
  { name: "Computers & Gaming", handle: "computers-gaming", parent: null },
  { name: "Laptops", handle: "laptops", parent: "computers-gaming" },
  { name: "MSI", handle: "msi-laptops", parent: "laptops" },
  { name: "Asus", handle: "asus-laptops", parent: "laptops" },
  { name: "Microsoft", handle: "microsoft-laptops", parent: "laptops" },
  { name: "Dell", handle: "dell-laptops", parent: "laptops" },
  { name: "HP", handle: "hp-laptops", parent: "laptops" },
  { name: "Lenovo", handle: "lenovo-laptops", parent: "laptops" },
  { name: "Macbook", handle: "macbook", parent: "laptops" },
  { name: "Laptops Accessories", handle: "laptops-accessories", parent: "computers-gaming" },
  { name: "Cooling Pad", handle: "cooling-pad", parent: "laptops-accessories" },
  { name: "Laptop Cases & Covers", handle: "laptop-cases-covers", parent: "laptops-accessories" },
  { name: "Laptop Bags & Sleeves", handle: "laptop-bags-sleeves", parent: "laptops-accessories" },
  { name: "Laptop Stands", handle: "laptop-stands", parent: "laptops-accessories" },
  { name: "Laptop Screen Protectors", handle: "laptop-screen-protectors", parent: "laptops-accessories" },
  { name: "Computer Accessories", handle: "computer-accessories", parent: "computers-gaming" },
  { name: "Monitors", handle: "monitors", parent: "computer-accessories" },
  { name: "Cleaning", handle: "computer-cleaning", parent: "computer-accessories" },
  { name: "Mouse & Keyboards", handle: "mouse-keyboards", parent: "computer-accessories" },
  { name: "Mouse & Keyboard Combos", handle: "mouse-keyboard-combos", parent: "mouse-keyboards" },
  { name: "Mouse", handle: "mouse", parent: "mouse-keyboards" },
  { name: "Keyboards", handle: "keyboards", parent: "mouse-keyboards" },
  { name: "Mouse Pad", handle: "mouse-pad", parent: "mouse-keyboards" },
  { name: "USB Hubs", handle: "usb-hubs", parent: "computer-accessories" },
  { name: "HDMI Cables", handle: "hdmi-cables", parent: "computer-accessories" },
  { name: "Memory Card Readers", handle: "memory-card-readers", parent: "computer-accessories" },
  { name: "Webcams", handle: "webcams", parent: "computer-accessories" },
  { name: "Storage", handle: "storage", parent: "computers-gaming" },
  { name: "External SSD", handle: "external-ssd", parent: "storage" },
  { name: "USB Flash Drives", handle: "usb-flash-drives", parent: "storage" },
  { name: "Networking", handle: "networking", parent: "computers-gaming" },
  { name: "Wireless Routers", handle: "wireless-routers", parent: "networking" },
  { name: "Wireless Adapters", handle: "wireless-adapters", parent: "networking" },
  { name: "Routers", handle: "routers", parent: "networking" },
  { name: "Gaming Devices", handle: "gaming-devices", parent: "computers-gaming" },
  { name: "Laptops & Desktops", handle: "gaming-laptops-desktops", parent: "gaming-devices" },
  { name: "Consoles", handle: "consoles", parent: "gaming-devices" },
  { name: "Gaming Consoles", handle: "gaming-consoles", parent: "consoles" },
  { name: "Xbox", handle: "xbox", parent: "consoles" },
  { name: "PlayStation", handle: "playstation", parent: "consoles" },
  { name: "Gaming Accessories", handle: "gaming-accessories", parent: "gaming-devices" },
  { name: "Joysticks", handle: "joysticks", parent: "gaming-accessories" },
  { name: "Gaming Keyboard & Mouse Combos", handle: "gaming-keyboard-mouse-combos", parent: "gaming-accessories" },
  { name: "Gaming Speaker", handle: "gaming-speaker", parent: "gaming-accessories" },
  { name: "Gaming Keyboards", handle: "gaming-keyboards", parent: "gaming-accessories" },
  { name: "Gaming Headphones", handle: "gaming-headphones", parent: "gaming-accessories" },
  { name: "Gaming Mouse", handle: "gaming-mouse", parent: "gaming-accessories" },
  { name: "Gaming Chairs", handle: "gaming-chairs", parent: "gaming-accessories" },

  // Toys, Games & Kids
  { name: "Toys, Games & Kids", handle: "toys-games-kids", parent: null },
  { name: "Toys", handle: "toys", parent: "toys-games-kids" },
  { name: "Water Pools", handle: "water-pools", parent: "toys" },
  { name: "Walkie Talkies", handle: "walkie-talkies", parent: "toys" },
  { name: "Cycling", handle: "cycling", parent: "toys-games-kids" },
  { name: "Electric Bicycle", handle: "electric-bicycle", parent: "cycling" },
  { name: "Electric Scooters", handle: "electric-scooters", parent: "cycling" },
  { name: "Electric Scooter Accessories", handle: "electric-scooter-accessories", parent: "cycling" },

  // Automotives
  { name: "Automotives", handle: "automotives", parent: null },
  { name: "Car Electronics", handle: "car-electronics", parent: "automotives" },
  { name: "Car Chargers & Transmitters", handle: "car-chargers-transmitters", parent: "car-electronics" },
  { name: "Camera & Sensor", handle: "car-camera-sensor", parent: "car-electronics" },
  { name: "Jump Starters", handle: "jump-starters", parent: "car-electronics" },
  { name: "Tire Gauge", handle: "tire-gauge", parent: "car-electronics" },
  { name: "Car Multimedia", handle: "car-multimedia", parent: "car-electronics" },
  { name: "Mobile Mounts & Chargers", handle: "mobile-mounts-chargers", parent: "car-electronics" },
  { name: "Car Interior", handle: "car-interior", parent: "automotives" },
  { name: "Interior Care", handle: "interior-care", parent: "car-interior" },
  { name: "Car Organizers", handle: "car-organizers", parent: "car-interior" },
  { name: "Car Exterior", handle: "car-exterior", parent: "automotives" },
  { name: "Compressor & Inflators", handle: "compressor-inflators", parent: "car-exterior" },
  { name: "Car Wash", handle: "car-wash", parent: "car-exterior" },
  { name: "Other Exterior", handle: "other-exterior", parent: "car-exterior" },

  // Hot Deals
  { name: "Hot Deals", handle: "hot-deals", parent: null },
];

export default async function recreateCategories({ container }: ExecArgs) {
  const productCategoryService = container.resolve(Modules.PRODUCT);
  const logger = container.resolve("logger");

  logger.info("🚀 Recreating all categories...\n");

  // Store handle to ID mapping
  const handleToId: Record<string, string> = {};

  try {
    // First, delete all existing categories
    logger.info("Step 1: Deleting all existing categories...\n");
    let allCategories = await productCategoryService.listProductCategories({}, { take: 1000 });
    
    while (allCategories.length > 0) {
      const ids = allCategories.map(c => c.id);
      for (const id of ids) {
        try {
          await productCategoryService.deleteProductCategories([id]);
        } catch (e) {
          // Ignore
        }
      }
      allCategories = await productCategoryService.listProductCategories({}, { take: 1000 });
      logger.info(`  Remaining: ${allCategories.length}`);
    }
    
    logger.info("  ✓ All categories deleted\n");

    // Step 2: Create categories in order (parents first)
    logger.info("Step 2: Creating new categories...\n");

    // First pass: create all root categories
    for (const cat of CATEGORIES.filter(c => c.parent === null)) {
      try {
        const { result } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [{
              name: cat.name,
              handle: cat.handle,
              is_active: true,
              is_internal: false,
            }]
          }
        });
        handleToId[cat.handle] = result[0].id;
        logger.info(`  ✓ Created: ${cat.name}`);
      } catch (e: unknown) {
        logger.warn(`  ⚠️ Failed: ${cat.name} - ${(e as Error).message}`);
      }
    }

    // Multiple passes for children (to handle nested categories)
    for (let pass = 0; pass < 5; pass++) {
      for (const cat of CATEGORIES.filter(c => c.parent !== null)) {
        if (handleToId[cat.handle]) continue; // Already created
        
        const parentId = handleToId[cat.parent!];
        if (!parentId) continue; // Parent not created yet

        try {
          const { result } = await createProductCategoriesWorkflow(container).run({
            input: {
              product_categories: [{
                name: cat.name,
                handle: cat.handle,
                parent_category_id: parentId,
                is_active: true,
                is_internal: false,
              }]
            }
          });
          handleToId[cat.handle] = result[0].id;
          logger.info(`  ✓ Created: ${cat.name}`);
        } catch (e: unknown) {
          // Will retry in next pass
        }
      }
    }

    // Count results
    const finalCount = Object.keys(handleToId).length;
    logger.info(`\n✅ Done! Created ${finalCount} categories.`);

    // List main categories
    const mainCats = CATEGORIES.filter(c => c.parent === null);
    logger.info(`\nMain categories (${mainCats.length}):`);
    mainCats.forEach(c => {
      logger.info(`  - ${c.name} (${c.handle})`);
    });

  } catch (error: unknown) {
    logger.error("Failed:", error as Error);
    throw error;
  }
}
