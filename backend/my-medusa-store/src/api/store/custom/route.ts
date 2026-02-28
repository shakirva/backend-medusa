import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const freeThreshold = Number(process.env.FREE_DELIVERY_THRESHOLD_KWD || 7);
  const shippingBelowThreshold = Number(
    process.env.SHIPPING_CHARGE_BELOW_THRESHOLD_KWD || 1
  );

  const options = [
    {
      key: "night",
      label: "Night Delivery",
      label_ar: "توصيل ليلي",
    },
    {
      key: "fast",
      label: "Fast Delivery",
      label_ar: "توصيل سريع",
    },
    {
      key: "normal",
      label: "Normal Delivery",
      label_ar: "توصيل عادي",
    },
  ];

  res.status(200).json({
    delivery_options: options,
    shipping_policy: {
      currency: "KWD",
      free_delivery_threshold: freeThreshold,
      charge_below_threshold: shippingBelowThreshold,
      summary: `Free delivery for ${freeThreshold} KD or above, otherwise ${shippingBelowThreshold} KD shipping charge.`,
    },
  });
}
