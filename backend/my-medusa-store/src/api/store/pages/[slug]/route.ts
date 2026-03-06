import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/pages/:slug
 * Returns static page content for:
 * - about (About MarqaSouq)
 * - privacy-policy
 * - terms-and-conditions
 * - return-policy
 * - shipping-policy
 * - contact-us
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params

  const pages: Record<string, any> = {
    about: {
      slug: "about",
      title: "About MarqaSouq",
      title_ar: "عن ماركة سوق",
      content: `MarqaSouq is your premier online destination for electronics, gadgets, and lifestyle products in Kuwait and the Gulf region.

We offer a curated selection of the latest technology products, from smartphones and laptops to smart home devices and accessories, all at competitive prices with fast delivery across Kuwait.

**Our Mission:** To provide the best online shopping experience with authentic products, competitive prices, and exceptional customer service.

**Why Choose MarqaSouq?**
• 100% Authentic Products
• Fast Delivery Across Kuwait
• Easy Returns & Exchanges
• Secure Payment Options
• 24/7 Customer Support
• Competitive Prices`,
      content_ar: `ماركة سوق هي وجهتك الأولى للتسوق الإلكتروني للإلكترونيات والأدوات والمنتجات الحياتية في الكويت ومنطقة الخليج.

نقدم مجموعة مختارة من أحدث منتجات التكنولوجيا، من الهواتف الذكية وأجهزة الكمبيوتر المحمولة إلى أجهزة المنزل الذكي والإكسسوارات، بأسعار تنافسية مع توصيل سريع في جميع أنحاء الكويت.`,
      updated_at: "2026-01-01T00:00:00Z",
    },
    "privacy-policy": {
      slug: "privacy-policy",
      title: "Privacy Policy",
      title_ar: "سياسة الخصوصية",
      content: `**Privacy Policy - MarqaSouq**

Last updated: January 1, 2026

**1. Information We Collect**
We collect personal information you provide when you create an account, place an order, or contact us. This includes:
- Name, email address, phone number
- Shipping and billing addresses
- Payment information (processed securely via our payment partners)
- Order history and preferences

**2. How We Use Your Information**
- To process and fulfill your orders
- To communicate with you about your orders
- To send promotional offers (with your consent)
- To improve our services and user experience
- To comply with legal obligations

**3. Information Sharing**
We do not sell your personal information. We may share information with:
- Delivery partners for order fulfillment
- Payment processors for transaction processing
- Legal authorities when required by law

**4. Data Security**
We implement industry-standard security measures to protect your personal information, including SSL encryption and secure data storage.

**5. Your Rights**
You have the right to:
- Access your personal data
- Update or correct your information
- Delete your account and associated data
- Opt out of marketing communications

**6. Contact Us**
For privacy-related inquiries, contact us at:
Email: privacy@markasouqs.com
Phone: +965 XXXX XXXX`,
      content_ar: "سياسة الخصوصية - ماركة سوق\n\nنحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.",
      updated_at: "2026-01-01T00:00:00Z",
    },
    "terms-and-conditions": {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      title_ar: "الشروط والأحكام",
      content: `**Terms & Conditions - MarqaSouq**

Last updated: January 1, 2026

**1. General**
By using MarqaSouq, you agree to these terms and conditions. Please read them carefully before making a purchase.

**2. Products**
- All products are 100% authentic and sourced from authorized distributors
- Product images are for illustration purposes; actual products may vary slightly
- Prices are in Kuwaiti Dinar (KWD) unless otherwise stated
- We reserve the right to modify prices without prior notice

**3. Orders**
- Orders are confirmed upon successful payment
- We reserve the right to cancel orders due to stock unavailability
- Order modifications are accepted before shipping

**4. Payment**
- We accept Credit/Debit cards, KNET, Apple Pay, and Cash on Delivery
- All transactions are processed securely

**5. Delivery**
- Standard delivery: 1-3 business days within Kuwait
- Express delivery: Same day or next day (subject to availability)
- Free delivery on orders above 7 KWD
- Delivery charges of 1 KWD for orders below 7 KWD

**6. Returns & Exchanges**
- Returns accepted within 7 days of delivery
- Products must be in original condition with packaging
- Refunds processed within 5-7 business days
- Non-returnable items: Opened electronics, personal care products

**7. Warranty**
- Products come with manufacturer warranty where applicable
- Warranty claims should be directed to our customer service

**8. Contact**
Email: support@markasouqs.com
Phone: +965 XXXX XXXX`,
      content_ar: "الشروط والأحكام - ماركة سوق\n\nباستخدامك لماركة سوق، فإنك توافق على هذه الشروط والأحكام.",
      updated_at: "2026-01-01T00:00:00Z",
    },
    "return-policy": {
      slug: "return-policy",
      title: "Return Policy",
      title_ar: "سياسة الإرجاع",
      content: `**Return Policy - MarqaSouq**

- Returns accepted within 7 days of delivery
- Product must be unused and in original packaging
- Contact support@markasouqs.com to initiate a return
- Refunds are processed within 5-7 business days
- Shipping costs for returns are borne by the customer unless the product is defective`,
      content_ar: "سياسة الإرجاع - ماركة سوق",
      updated_at: "2026-01-01T00:00:00Z",
    },
    "shipping-policy": {
      slug: "shipping-policy",
      title: "Shipping Policy",
      title_ar: "سياسة الشحن",
      content: `**Shipping Policy - MarqaSouq**

- Standard delivery: 1-3 business days
- Express delivery: Same day / Next day
- Free delivery on orders above 7 KWD
- 1 KWD shipping fee for orders below 7 KWD
- We deliver across all areas in Kuwait`,
      content_ar: "سياسة الشحن - ماركة سوق",
      updated_at: "2026-01-01T00:00:00Z",
    },
    "contact-us": {
      slug: "contact-us",
      title: "Contact Us",
      title_ar: "اتصل بنا",
      content: `**Contact MarqaSouq**

Email: support@markasouqs.com
Phone: +965 XXXX XXXX
WhatsApp: +965 XXXX XXXX

Working Hours: Sunday - Thursday, 9:00 AM - 6:00 PM (Kuwait Time)

Address: Kuwait City, Kuwait`,
      content_ar: "اتصل بنا - ماركة سوق",
      updated_at: "2026-01-01T00:00:00Z",
    },
  }

  const page = pages[slug]

  if (!page) {
    return res.status(404).json({
      type: "not_found",
      message: `Page '${slug}' not found`,
      available_pages: Object.keys(pages),
    })
  }

  res.json({ page })
}
