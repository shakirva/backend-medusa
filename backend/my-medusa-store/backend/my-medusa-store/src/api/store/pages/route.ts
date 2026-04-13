import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/pages
 * Returns list of available static pages
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({
    pages: [
      { slug: "about", title: "About MarqaSouq", title_ar: "عن ماركة سوق" },
      { slug: "privacy-policy", title: "Privacy Policy", title_ar: "سياسة الخصوصية" },
      { slug: "terms-and-conditions", title: "Terms & Conditions", title_ar: "الشروط والأحكام" },
      { slug: "return-policy", title: "Return Policy", title_ar: "سياسة الإرجاع" },
      { slug: "shipping-policy", title: "Shipping Policy", title_ar: "سياسة الشحن" },
      { slug: "contact-us", title: "Contact Us", title_ar: "اتصل بنا" },
    ],
  })
}
