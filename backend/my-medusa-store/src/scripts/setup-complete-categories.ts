/**
 * Setup Complete Category Hierarchy
 * Based on the client's final category list
 * 
 * Run with: npx medusa exec ./src/scripts/setup-complete-categories.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { createProductCategoriesWorkflow, deleteProductCategoriesWorkflow, updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

// Category structure based on client requirements
interface CategoryItem {
  name: string;
  handle: string;
  nameAr?: string;
  children?: CategoryItem[];
}

// =============================================================================
// COMPLETE CATEGORY TREE - Based on Client's Requirements
// =============================================================================
const CATEGORY_TREE: CategoryItem[] = [
  // 1️⃣ MOBILE & TABLET
  {
    name: "Mobile & Tablet",
    handle: "mobile-tablet",
    nameAr: "موبايل وتابلت",
    children: [
      // Mobiles Section
      {
        name: "Mobiles",
        handle: "mobiles",
        nameAr: "الهواتف المحمولة",
        children: [
          { name: "iPhone", handle: "iphone", nameAr: "آيفون" },
          { name: "Samsung", handle: "samsung-mobiles", nameAr: "سامسونج" },
          { name: "Asus ROG", handle: "asus-rog", nameAr: "أسوس روج" },
          { name: "One Plus", handle: "one-plus", nameAr: "ون بلس" },
          { name: "Nothing Technology", handle: "nothing-technology", nameAr: "ناثينج تكنولوجي" },
          { name: "Vivo", handle: "vivo", nameAr: "فيفو" },
          { name: "Oppo", handle: "oppo", nameAr: "أوبو" },
        ]
      },
      // Tablets Section
      {
        name: "Tablets",
        handle: "tablets",
        nameAr: "التابلت",
        children: [
          { name: "Lenovo", handle: "lenovo-tablets", nameAr: "لينوفو" },
          { name: "Amazon", handle: "amazon-tablets", nameAr: "أمازون" },
          { name: "Apple", handle: "apple-tablets", nameAr: "أبل" },
          { name: "Green Lion", handle: "green-lion-tablets", nameAr: "جرين ليون" },
          { name: "Huawei", handle: "huawei-tablets", nameAr: "هواوي" },
          { name: "Samsung", handle: "samsung-tablets", nameAr: "سامسونج" },
        ]
      },
      // Mobile Accessories Section
      {
        name: "Mobile Accessories",
        handle: "mobile-accessories",
        nameAr: "اكسسوارات الهاتف",
        children: [
          { name: "Lanyard", handle: "lanyard", nameAr: "حبل الهاتف" },
          { name: "Mobile Cases", handle: "mobile-cases", nameAr: "كفرات الهاتف" },
          { name: "Screen Protectors", handle: "screen-protectors", nameAr: "واقي الشاشة" },
          { name: "OTG Adapter", handle: "otg-adapter", nameAr: "محول OTG" },
          { name: "Mobile Charger", handle: "mobile-charger", nameAr: "شاحن الهاتف" },
          { name: "Holder", handle: "mobile-holder", nameAr: "حامل الهاتف" },
          { name: "Screen Cleaners", handle: "screen-cleaners", nameAr: "منظف الشاشة" },
          { name: "Phone Cooler", handle: "phone-cooler", nameAr: "مبرد الهاتف" },
          { name: "Charging Cables", handle: "charging-cables", nameAr: "كيبلات الشحن" },
          { name: "IQOS Cases", handle: "iqos-cases", nameAr: "كفرات آيكوس" },
          { name: "Lenses", handle: "mobile-lenses", nameAr: "عدسات" },
          { name: "Lens Protectors", handle: "lens-protectors", nameAr: "واقي العدسة" },
          { name: "UV Phone Steriliser Boxes", handle: "uv-phone-steriliser-boxes", nameAr: "صندوق تعقيم الهاتف" },
          { name: "Holders, Grips & Stands", handle: "holders-grips-stands", nameAr: "حوامل ومقابض" },
          { name: "Smart Tag", handle: "smart-tag", nameAr: "سمارت تاج" },
          { name: "Styluses, Universal Pens & Accessories", handle: "styluses-pens", nameAr: "أقلام ذكية" },
        ]
      },
      // Tablet Accessories Section
      {
        name: "Tablet Accessories",
        handle: "tablet-accessories",
        nameAr: "اكسسوارات التابلت",
        children: [
          { name: "Tablet Cases", handle: "tablet-cases", nameAr: "كفرات التابلت" },
          { name: "Tablet Screen Protector", handle: "tablet-screen-protector", nameAr: "واقي شاشة التابلت" },
          { name: "Tablet Stands", handle: "tablet-stands", nameAr: "حامل التابلت" },
          { name: "Tablet Keyboards", handle: "tablet-keyboards", nameAr: "لوحة مفاتيح التابلت" },
        ]
      },
      // Power Banks Section
      {
        name: "Power Banks",
        handle: "power-banks",
        nameAr: "باور بانك",
        children: [
          { name: "Under 10K mAh", handle: "power-banks-under-10k", nameAr: "أقل من 10000 مللي أمبير" },
          { name: "10-20K mAh", handle: "power-banks-10-20k", nameAr: "10000-20000 مللي أمبير" },
          { name: "21-30K mAh", handle: "power-banks-21-30k", nameAr: "21000-30000 مللي أمبير" },
          { name: "Over 31000mAh", handle: "power-banks-over-31k", nameAr: "أكثر من 31000 مللي أمبير" },
          { name: "Power Station", handle: "power-station", nameAr: "محطة طاقة" },
        ]
      },
    ]
  },

  // 2️⃣ HEALTH & BEAUTY
  {
    name: "Health & Beauty",
    handle: "health-beauty",
    nameAr: "الصحة والجمال",
    children: [
      // Beauty & Cosmetics
      {
        name: "Beauty & Cosmetics",
        handle: "beauty-cosmetics",
        nameAr: "التجميل ومستحضرات التجميل",
        children: [
          { name: "Make-Up Organizer", handle: "makeup-organizer", nameAr: "منظم المكياج" },
          { name: "Makeup Mirrors", handle: "makeup-mirrors", nameAr: "مرايا المكياج" },
          { name: "Fragrances & Perfumes", handle: "fragrances-perfumes", nameAr: "العطور" },
          { name: "Manicure & Pedicure", handle: "manicure-pedicure", nameAr: "مانيكير وباديكير" },
        ]
      },
      // Hair Styling
      {
        name: "Hair Styling",
        handle: "hair-styling",
        nameAr: "تصفيف الشعر",
      },
      // Shavers & Hair Removal
      {
        name: "Shavers & Hair Removal",
        handle: "shavers-hair-removal",
        nameAr: "الحلاقة وإزالة الشعر",
        children: [
          { name: "Shavers and Trimmers", handle: "shavers-trimmers", nameAr: "ماكينات الحلاقة" },
          { name: "Hair Remover", handle: "hair-remover", nameAr: "مزيل الشعر" },
        ]
      },
      // Health
      {
        name: "Health",
        handle: "health",
        nameAr: "الصحة",
        children: [
          { name: "Ring", handle: "health-ring", nameAr: "خاتم صحي" },
          { name: "Medical Care", handle: "medical-care", nameAr: "الرعاية الطبية" },
          { name: "Face Masks & Shields", handle: "face-masks-shields", nameAr: "كمامات ودروع الوجه" },
          { name: "Massage & Relaxation", handle: "massage-relaxation", nameAr: "المساج والاسترخاء" },
          { name: "Baby Care", handle: "baby-care", nameAr: "رعاية الأطفال" },
          { name: "Health & Skin Care", handle: "health-skin-care", nameAr: "العناية بالبشرة" },
          { name: "Dental Care", handle: "dental-care", nameAr: "العناية بالأسنان" },
        ]
      },
      // Fitness
      {
        name: "Fitness",
        handle: "fitness",
        nameAr: "اللياقة البدنية",
        children: [
          { name: "Health & Fitness Equipments", handle: "fitness-equipments", nameAr: "معدات اللياقة" },
          { name: "Smart Body Scales", handle: "smart-body-scales", nameAr: "الميزان الذكي" },
        ]
      },
    ]
  },

  // 3️⃣ ELECTRONICS
  {
    name: "Electronics",
    handle: "electronics",
    nameAr: "الإلكترونيات",
    children: [
      // Watches
      {
        name: "Watches",
        handle: "watches",
        nameAr: "الساعات",
        children: [
          { name: "Kids' Smart Watches", handle: "kids-smart-watches", nameAr: "ساعات الأطفال الذكية" },
          { name: "Smart Bands", handle: "smart-bands", nameAr: "السوار الذكي" },
          { name: "Smart Watches", handle: "smart-watches", nameAr: "الساعات الذكية" },
        ]
      },
      // Watch Accessories
      {
        name: "Watch Accessories",
        handle: "watch-accessories",
        nameAr: "اكسسوارات الساعات",
        children: [
          { name: "Bands & Straps", handle: "watch-bands-straps", nameAr: "أحزمة الساعات" },
          { name: "Screen Protectors", handle: "watch-screen-protectors", nameAr: "واقي شاشة الساعة" },
          { name: "Cases & Covers", handle: "watch-cases-covers", nameAr: "كفرات الساعة" },
          { name: "Smart Watch Chargers", handle: "smart-watch-chargers", nameAr: "شواحن الساعات الذكية" },
        ]
      },
      // Speakers & Accessories
      {
        name: "Speakers & Accessories",
        handle: "speakers-accessories",
        nameAr: "السماعات والاكسسوارات",
        children: [
          { name: "Bluetooth Speakers", handle: "bluetooth-speakers", nameAr: "سماعات بلوتوث" },
          { name: "AUX Cables", handle: "aux-cables", nameAr: "كيبلات AUX" },
          { name: "Speaker Cases & Covers", handle: "speaker-cases-covers", nameAr: "كفرات السماعات" },
          { name: "Home Speakers & Soundbars", handle: "home-speakers-soundbars", nameAr: "سماعات المنزل وساوند بار" },
        ]
      },
      // Earphones & Headphones
      {
        name: "Earphones & Headphones",
        handle: "earphones-headphones",
        nameAr: "السماعات",
        children: [
          { name: "Kids' Headphones", handle: "kids-headphones", nameAr: "سماعات الأطفال" },
          { name: "On-Ear Headphones", handle: "on-ear-headphones", nameAr: "سماعات أذن" },
          { name: "Open-Ear Headphones", handle: "open-ear-headphones", nameAr: "سماعات مفتوحة" },
          { name: "Over-Ear Headphones", handle: "over-ear-headphones", nameAr: "سماعات فوق الأذن" },
          { name: "Earbuds", handle: "earbuds", nameAr: "سماعات لاسلكية" },
          { name: "Earbuds Accessories", handle: "earbuds-accessories", nameAr: "اكسسوارات السماعات اللاسلكية" },
          { name: "Earphones", handle: "earphones", nameAr: "سماعات أذن سلكية" },
          { name: "Microphones", handle: "microphones", nameAr: "مايكروفونات" },
        ]
      },
      // Cameras
      {
        name: "Cameras",
        handle: "cameras",
        nameAr: "الكاميرات",
        children: [
          { name: "Digital Cameras", handle: "digital-cameras", nameAr: "كاميرات رقمية" },
          { name: "DSLR Cameras", handle: "dslr-cameras", nameAr: "كاميرات DSLR" },
          { name: "Mirrorless Cameras", handle: "mirrorless-cameras", nameAr: "كاميرات ميرورليس" },
          { name: "Action Cameras", handle: "action-cameras", nameAr: "كاميرات الأكشن" },
          { name: "Security Cameras", handle: "security-cameras", nameAr: "كاميرات المراقبة" },
          { name: "Drones", handle: "drones", nameAr: "طائرات درون" },
          { name: "Binoculars", handle: "binoculars", nameAr: "منظار" },
          { name: "Tripods", handle: "tripods", nameAr: "حوامل ثلاثية" },
          { name: "Accessories", handle: "camera-accessories", nameAr: "اكسسوارات الكاميرا" },
          { name: "Gimbals", handle: "gimbals", nameAr: "جيمبال" },
          { name: "Instant Photo Printers", handle: "instant-photo-printers", nameAr: "طابعات الصور الفورية" },
        ]
      },
      // Printers & Scanners
      {
        name: "Printers & Scanners",
        handle: "printers-scanners",
        nameAr: "الطابعات والماسحات",
        children: [
          { name: "Printers", handle: "printers", nameAr: "طابعات" },
          { name: "Scanners", handle: "scanners", nameAr: "ماسحات ضوئية" },
          { name: "Printer Cartridges & Inks", handle: "printer-cartridges-inks", nameAr: "حبر الطابعة" },
        ]
      },
      // Televisions
      {
        name: "Televisions",
        handle: "televisions",
        nameAr: "التلفزيونات",
      },
      // Powerology
      {
        name: "Powerology",
        handle: "powerology",
        nameAr: "باورولوجي",
      },
      // Others
      {
        name: "Others",
        handle: "electronics-others",
        nameAr: "أخرى",
      },
      // Glasses & Accessories
      {
        name: "Glasses & Accessories",
        handle: "glasses-accessories",
        nameAr: "النظارات والاكسسوارات",
      },
      // Streaming Devices
      {
        name: "Streaming Devices",
        handle: "streaming-devices",
        nameAr: "أجهزة البث",
      },
      // Projectors
      {
        name: "Projectors",
        handle: "projectors",
        nameAr: "البروجكتور",
      },
    ]
  },

  // 4️⃣ HOME & KITCHEN
  {
    name: "Home & Kitchen",
    handle: "home-kitchen",
    nameAr: "المنزل والمطبخ",
    children: [
      // Home Section
      {
        name: "Home",
        handle: "home",
        nameAr: "المنزل",
        children: [
          { name: "Electric Mosquito Killers", handle: "electric-mosquito-killers", nameAr: "قاتل البعوض الكهربائي" },
          { name: "Refrigerators", handle: "refrigerators", nameAr: "الثلاجات" },
          { name: "Portable Fridges", handle: "portable-fridges", nameAr: "ثلاجات محمولة" },
          { name: "Mini Fridges", handle: "mini-fridges", nameAr: "ثلاجات صغيرة" },
          { name: "Ice Makers", handle: "ice-makers", nameAr: "صانعة الثلج" },
        ]
      },
      // Cleaning
      {
        name: "Cleaning",
        handle: "cleaning",
        nameAr: "التنظيف",
        children: [
          { name: "Washers & Dryers", handle: "washers-dryers", nameAr: "الغسالات والمجففات" },
          { name: "Vacuum and Cleaners", handle: "vacuum-cleaners", nameAr: "المكانس الكهربائية" },
          { name: "Jet Fan & Blower", handle: "jet-fan-blower", nameAr: "منفاخ الهواء" },
          { name: "Irons & Steamers", handle: "irons-steamers", nameAr: "المكواة والبخار" },
        ]
      },
      // Bakhour (Aroma)
      {
        name: "Bakhour",
        handle: "bakhour",
        nameAr: "البخور",
        children: [
          { name: "Aroma Diffusers", handle: "aroma-diffusers", nameAr: "موزع العطر" },
        ]
      },
      // Air Conditioning
      {
        name: "Air Conditioning",
        handle: "air-conditioning",
        nameAr: "تكييف الهواء",
        children: [
          { name: "Portable Fan", handle: "portable-fan", nameAr: "مراوح محمولة" },
          { name: "Air Coolers", handle: "air-coolers", nameAr: "مبردات الهواء" },
          { name: "Air Purifiers", handle: "air-purifiers", nameAr: "منقي الهواء" },
        ]
      },
      // Smart Home
      {
        name: "Smart Home",
        handle: "smart-home",
        nameAr: "المنزل الذكي",
      },
      // Pet Supplies
      {
        name: "Pet Supplies",
        handle: "pet-supplies",
        nameAr: "مستلزمات الحيوانات",
      },
      // Lightings
      {
        name: "Lightings",
        handle: "lightings",
        nameAr: "الإضاءة",
      },
      // Tools
      {
        name: "Tools",
        handle: "tools",
        nameAr: "الأدوات",
      },
      // Kitchen Section
      {
        name: "Kitchen",
        handle: "kitchen",
        nameAr: "المطبخ",
        children: [
          { name: "Kitchen Appliances", handle: "kitchen-appliances", nameAr: "أجهزة المطبخ" },
          { name: "Grill & Toaster", handle: "grill-toaster", nameAr: "الشواية والتوستر" },
          { name: "Water Dispenser", handle: "water-dispenser", nameAr: "موزع المياه" },
          { name: "Blenders, Juicers & Mixers", handle: "blenders-juicers-mixers", nameAr: "الخلاطات والعصارات" },
          { name: "Food Weighing Scales", handle: "food-weighing-scales", nameAr: "ميزان الطعام" },
          { name: "Choppers", handle: "choppers", nameAr: "المفرمة" },
          { name: "Electric Pressure Cooker", handle: "electric-pressure-cooker", nameAr: "قدر الضغط الكهربائي" },
          { name: "Thermal Mugs & Bottles", handle: "thermal-mugs-bottles", nameAr: "أكواب وزجاجات حرارية" },
          { name: "Kettle", handle: "kettle", nameAr: "الغلاية" },
          { name: "Air Fryers", handle: "air-fryers", nameAr: "المقلاة الهوائية" },
          { name: "Vacuum Sealers", handle: "vacuum-sealers", nameAr: "جهاز تفريغ الهواء" },
        ]
      },
      // Coffee, Tea & Espresso
      {
        name: "Coffee, Tea & Espresso",
        handle: "coffee-tea-espresso",
        nameAr: "القهوة والشاي",
        children: [
          { name: "Espresso Machines", handle: "espresso-machines", nameAr: "ماكينات الإسبريسو" },
          { name: "Coffee Brewers", handle: "coffee-brewers", nameAr: "صانعة القهوة" },
          { name: "Portable Coffee Maker", handle: "portable-coffee-maker", nameAr: "صانعة قهوة محمولة" },
          { name: "Grinder", handle: "grinder", nameAr: "مطحنة القهوة" },
          { name: "Milk Frother", handle: "milk-frother", nameAr: "خفاقة الحليب" },
          { name: "Equipment", handle: "coffee-equipment", nameAr: "معدات القهوة" },
        ]
      },
      // Office
      {
        name: "Office",
        handle: "office",
        nameAr: "المكتب",
        children: [
          { name: "Presenter", handle: "presenter", nameAr: "جهاز العرض" },
          { name: "Smart Sockets", handle: "smart-sockets", nameAr: "مقابس ذكية" },
          { name: "Extension Power Sockets", handle: "extension-power-sockets", nameAr: "وصلات كهربائية" },
          { name: "Batteries", handle: "batteries", nameAr: "البطاريات" },
          { name: "Stationery", handle: "stationery", nameAr: "الأدوات المكتبية" },
        ]
      },
    ]
  },

  // 5️⃣ FASHION
  {
    name: "Fashion",
    handle: "fashion",
    nameAr: "الأزياء",
    children: [
      // Luggages & Accessories
      {
        name: "Luggages & Accessories",
        handle: "luggages-accessories",
        nameAr: "الحقائب والاكسسوارات",
        children: [
          { name: "Luggage", handle: "luggage", nameAr: "حقائب السفر" },
          { name: "Travel Accessories", handle: "travel-accessories", nameAr: "اكسسوارات السفر" },
        ]
      },
      // Bags
      {
        name: "Bags",
        handle: "bags",
        nameAr: "الحقائب",
        children: [
          { name: "Backpacks", handle: "backpacks", nameAr: "حقائب الظهر" },
          { name: "Bags & Wallets", handle: "bags-wallets", nameAr: "حقائب ومحافظ" },
        ]
      },
    ]
  },

  // 6️⃣ OFFROAD
  {
    name: "Offroad",
    handle: "offroad",
    nameAr: "الرحلات البرية",
    children: [
      // Camping Essentials
      {
        name: "Camping Essentials",
        handle: "camping-essentials",
        nameAr: "أساسيات التخييم",
        children: [
          { name: "Chair & Table", handle: "chair-table", nameAr: "كراسي وطاولات" },
          { name: "Bidet", handle: "bidet", nameAr: "بيديه" },
          { name: "Other Camping Accessories", handle: "other-camping-accessories", nameAr: "اكسسوارات التخييم الأخرى" },
        ]
      },
      // Sleeping Gear & Shelter
      {
        name: "Sleeping Gear & Shelter",
        handle: "sleeping-gear-shelter",
        nameAr: "معدات النوم والمأوى",
        children: [
          { name: "Mattress", handle: "mattress", nameAr: "فراش" },
          { name: "Tent", handle: "tent", nameAr: "خيمة" },
        ]
      },
      // Communication & Power Solutions
      {
        name: "Communication & Power Solutions",
        handle: "communication-power-solutions",
        nameAr: "الاتصالات والطاقة",
        children: [
          { name: "Radio Communication Devices", handle: "radio-communication-devices", nameAr: "أجهزة اللاسلكي" },
          { name: "Power Generators", handle: "power-generators", nameAr: "مولدات الطاقة" },
        ]
      },
      // Camp Cooking & Lighting
      {
        name: "Camp Cooking & Lighting",
        handle: "camp-cooking-lighting",
        nameAr: "الطبخ والإضاءة",
        children: [
          { name: "Lights", handle: "camp-lights", nameAr: "إضاءة التخييم" },
          { name: "Stove & Grill", handle: "stove-grill", nameAr: "الموقد والشواية" },
        ]
      },
    ]
  },

  // 7️⃣ COMPUTERS & GAMING
  {
    name: "Computers & Gaming",
    handle: "computers-gaming",
    nameAr: "الكمبيوتر والألعاب",
    children: [
      // Laptops
      {
        name: "Laptops",
        handle: "laptops",
        nameAr: "اللابتوب",
        children: [
          { name: "MSI", handle: "msi-laptops", nameAr: "إم إس آي" },
          { name: "Asus", handle: "asus-laptops", nameAr: "أسوس" },
          { name: "Microsoft", handle: "microsoft-laptops", nameAr: "مايكروسوفت" },
          { name: "Dell", handle: "dell-laptops", nameAr: "ديل" },
          { name: "HP", handle: "hp-laptops", nameAr: "إتش بي" },
          { name: "Lenovo", handle: "lenovo-laptops", nameAr: "لينوفو" },
          { name: "Macbook", handle: "macbook", nameAr: "ماك بوك" },
        ]
      },
      // Laptops Accessories
      {
        name: "Laptops Accessories",
        handle: "laptops-accessories",
        nameAr: "اكسسوارات اللابتوب",
        children: [
          { name: "Cooling Pad", handle: "cooling-pad", nameAr: "قاعدة تبريد" },
          { name: "Laptop Cases & Covers", handle: "laptop-cases-covers", nameAr: "كفرات اللابتوب" },
          { name: "Laptop Bags & Sleeves", handle: "laptop-bags-sleeves", nameAr: "حقائب اللابتوب" },
          { name: "Laptop Stands", handle: "laptop-stands", nameAr: "حامل اللابتوب" },
          { name: "Laptop Screen Protectors", handle: "laptop-screen-protectors", nameAr: "واقي شاشة اللابتوب" },
        ]
      },
      // Computer Accessories
      {
        name: "Computer Accessories",
        handle: "computer-accessories",
        nameAr: "اكسسوارات الكمبيوتر",
        children: [
          { name: "Monitors", handle: "monitors", nameAr: "الشاشات" },
          { name: "Cleaning", handle: "computer-cleaning", nameAr: "التنظيف" },
        ]
      },
      // Mouse & Keyboards
      {
        name: "Mouse & Keyboards",
        handle: "mouse-keyboards",
        nameAr: "الماوس ولوحة المفاتيح",
        children: [
          { name: "Mouse & Keyboard Combos", handle: "mouse-keyboard-combos", nameAr: "كومبو ماوس ولوحة مفاتيح" },
          { name: "Mouse", handle: "mouse", nameAr: "ماوس" },
          { name: "Keyboards", handle: "keyboards", nameAr: "لوحة المفاتيح" },
          { name: "Mouse Pad", handle: "mouse-pad", nameAr: "لوحة الماوس" },
        ]
      },
      // USB & Connectivity
      {
        name: "USB Hubs",
        handle: "usb-hubs",
        nameAr: "موزع USB",
      },
      {
        name: "HDMI Cables",
        handle: "hdmi-cables",
        nameAr: "كيبلات HDMI",
      },
      {
        name: "Memory Card Readers",
        handle: "memory-card-readers",
        nameAr: "قارئ بطاقة الذاكرة",
      },
      {
        name: "Webcams",
        handle: "webcams",
        nameAr: "كاميرا الويب",
      },
      // Storage
      {
        name: "Storage",
        handle: "storage",
        nameAr: "التخزين",
        children: [
          { name: "External SSD", handle: "external-ssd", nameAr: "SSD خارجي" },
          { name: "USB Flash Drives", handle: "usb-flash-drives", nameAr: "فلاش ميموري" },
        ]
      },
      // Networking
      {
        name: "Networking",
        handle: "networking",
        nameAr: "الشبكات",
        children: [
          { name: "Wireless Routers", handle: "wireless-routers", nameAr: "راوتر لاسلكي" },
          { name: "Wireless Adapters", handle: "wireless-adapters", nameAr: "محول لاسلكي" },
          { name: "Routers", handle: "routers", nameAr: "راوتر" },
        ]
      },
      // Gaming Devices
      {
        name: "Gaming Devices",
        handle: "gaming-devices",
        nameAr: "أجهزة الألعاب",
        children: [
          { name: "Laptops & Desktops", handle: "gaming-laptops-desktops", nameAr: "لابتوبات وديسكتوب الألعاب" },
        ]
      },
      // Consoles
      {
        name: "Consoles",
        handle: "consoles",
        nameAr: "أجهزة الألعاب",
        children: [
          { name: "Gaming Consoles", handle: "gaming-consoles", nameAr: "كونسول الألعاب" },
          { name: "Xbox", handle: "xbox", nameAr: "إكس بوكس" },
          { name: "PlayStation", handle: "playstation", nameAr: "بلايستيشن" },
        ]
      },
      // Gaming Accessories
      {
        name: "Gaming Accessories",
        handle: "gaming-accessories",
        nameAr: "اكسسوارات الألعاب",
        children: [
          { name: "Joysticks", handle: "joysticks", nameAr: "عصا التحكم" },
          { name: "Gaming Keyboard & Mouse Combos", handle: "gaming-keyboard-mouse-combos", nameAr: "كومبو لوحة مفاتيح وماوس الألعاب" },
          { name: "Gaming Speaker", handle: "gaming-speaker", nameAr: "سماعات الألعاب" },
          { name: "Gaming Keyboards", handle: "gaming-keyboards", nameAr: "لوحة مفاتيح الألعاب" },
          { name: "Gaming Headphones", handle: "gaming-headphones", nameAr: "سماعات رأس الألعاب" },
          { name: "Gaming Mouse", handle: "gaming-mouse", nameAr: "ماوس الألعاب" },
          { name: "Gaming Chairs", handle: "gaming-chairs", nameAr: "كراسي الألعاب" },
        ]
      },
    ]
  },

  // 8️⃣ TOYS, GAMES & KIDS
  {
    name: "Toys, Games & Kids",
    handle: "toys-games-kids",
    nameAr: "الألعاب والأطفال",
    children: [
      // Toys
      {
        name: "Toys",
        handle: "toys",
        nameAr: "الألعاب",
        children: [
          { name: "Water Pools", handle: "water-pools", nameAr: "أحواض السباحة" },
          { name: "Walkie Talkies", handle: "walkie-talkies", nameAr: "أجهزة اللاسلكي للأطفال" },
        ]
      },
      // Cycling
      {
        name: "Cycling",
        handle: "cycling",
        nameAr: "الدراجات",
        children: [
          { name: "Electric Bicycle", handle: "electric-bicycle", nameAr: "دراجة كهربائية" },
          { name: "Electric Scooters", handle: "electric-scooters", nameAr: "سكوتر كهربائي" },
          { name: "Electric Scooter Accessories", handle: "electric-scooter-accessories", nameAr: "اكسسوارات السكوتر الكهربائي" },
        ]
      },
    ]
  },

  // 9️⃣ AUTOMOTIVES
  {
    name: "Automotives",
    handle: "automotives",
    nameAr: "السيارات",
    children: [
      // Car Electronics
      {
        name: "Car Electronics",
        handle: "car-electronics",
        nameAr: "إلكترونيات السيارة",
        children: [
          { name: "Car Chargers & Transmitters", handle: "car-chargers-transmitters", nameAr: "شواحن ومرسلات السيارة" },
          { name: "Camera & Sensor", handle: "car-camera-sensor", nameAr: "كاميرا ومستشعر السيارة" },
          { name: "Jump Starters", handle: "jump-starters", nameAr: "بادئ تشغيل السيارة" },
          { name: "Tire Gauge", handle: "tire-gauge", nameAr: "مقياس ضغط الإطارات" },
          { name: "Car Multimedia", handle: "car-multimedia", nameAr: "شاشات السيارة" },
          { name: "Mobile Mounts & Chargers", handle: "mobile-mounts-chargers", nameAr: "حوامل وشواحن الهاتف" },
        ]
      },
      // Car Interior
      {
        name: "Car Interior",
        handle: "car-interior",
        nameAr: "داخلية السيارة",
        children: [
          { name: "Interior Care", handle: "interior-care", nameAr: "العناية الداخلية" },
          { name: "Car Organizers", handle: "car-organizers", nameAr: "منظمات السيارة" },
        ]
      },
      // Car Exterior
      {
        name: "Car Exterior",
        handle: "car-exterior",
        nameAr: "خارجية السيارة",
        children: [
          { name: "Compressor & Inflators", handle: "compressor-inflators", nameAr: "الكمبريسور والنافخات" },
          { name: "Car Wash", handle: "car-wash", nameAr: "غسيل السيارة" },
          { name: "Other Exterior", handle: "other-exterior", nameAr: "اكسسوارات خارجية أخرى" },
        ]
      },
    ]
  },

  // 🔥 HOT DEALS (Special Category)
  {
    name: "Hot Deals",
    handle: "hot-deals",
    nameAr: "عروض ساخنة",
  },
];

export default async function setupCompleteCategories({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");

  logger.info("🔧 Setting up complete category hierarchy based on client requirements...\n");

  // Helper to find category by handle
  async function findCategoryByHandle(handle: string): Promise<any | null> {
    try {
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle", "parent_category_id"],
        filters: { handle },
      });
      return data && data.length > 0 ? data[0] : null;
    } catch {
      return null;
    }
  }

  // Helper function to create or update category
  async function createOrUpdateCategory(
    data: CategoryItem,
    parentCategoryId: string | null = null,
    rank: number = 0
  ): Promise<string> {
    try {
      const existing = await findCategoryByHandle(data.handle);
      let categoryId: string;

      if (existing) {
        // Update existing category
        try {
          await updateProductCategoriesWorkflow(container).run({
            input: {
              selector: { id: existing.id },
              update: {
                name: data.name,
                parent_category_id: parentCategoryId,
                rank: rank,
                is_active: true,
                is_internal: false,
                metadata: { name_ar: data.nameAr || null },
              },
            },
          });
          logger.info(`  ✓ Updated: ${data.name}`);
        } catch (e) {
          // Ignore update errors
        }
        categoryId = existing.id;
      } else {
        // Create new category
        const { result } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [{
              name: data.name,
              handle: data.handle,
              parent_category_id: parentCategoryId,
              rank: rank,
              is_active: true,
              is_internal: false,
              metadata: { name_ar: data.nameAr || null },
            }]
          }
        });
        categoryId = result[0].id;
        logger.info(`  ✓ Created: ${data.name}`);
      }

      // Recursively create children
      if (data.children && data.children.length > 0) {
        let childRank = 0;
        for (const child of data.children) {
          await createOrUpdateCategory(child, categoryId, childRank);
          childRank++;
        }
      }

      return categoryId;
    } catch (error: any) {
      logger.error(`  ✗ Error with ${data.name}: ${error.message}`);
      return "";
    }
  }

  try {
    // Process all categories
    logger.info("📁 Creating category hierarchy...\n");
    
    let mainRank = 0;
    for (const category of CATEGORY_TREE) {
      logger.info(`\n📦 Processing: ${category.name}`);
      await createOrUpdateCategory(category, null, mainRank);
      mainRank++;
    }

    // Count total categories
    const { data: allCategories } = await query.graph({
      entity: "product_category",
      fields: ["id"],
    });
    
    logger.info(`\n✅ Category setup complete!`);
    logger.info(`   Total categories: ${allCategories?.length || 0}`);

  } catch (error: any) {
    logger.error(`❌ Failed to setup categories: ${error.message}`);
    throw error;
  }
}
