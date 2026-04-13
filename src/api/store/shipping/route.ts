import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/shipping/options
 * 
 * Calculate available shipping methods for a cart
 * 
 * Query params:
 *   - cartId: Cart ID
 *   - productId: Product ID (for night delivery check)
 *   - areaCode: Area/Region code (for fast delivery check)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cartId, productId, areaCode } = req.query as Record<string, string>

    // Get the shipping service - will be registered in module index
    const shippingService = req.scope.resolve("shippingService")

    if (!shippingService) {
      return res.status(500).json({
        error: "Shipping service not available",
      })
    }

    // Get available shipping options
    const shippingOptions = await shippingService.getAvailableShipping({
      cartId,
      productId,
      areaCode,
    })

    return res.json({
      shipping_options: shippingOptions,
      message: `Found ${shippingOptions.length} available shipping methods`,
    })
  } catch (error) {
    console.error("[Shipping API] Error:", error)
    return res.status(500).json({
      error: "Failed to calculate shipping options",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * POST /store/shipping/validate
 * 
 * Validate if a shipping method is available for a cart
 * 
 * Body:
 *   - method: "normal" | "fast" | "night"
 *   - productId: Product ID
 *   - areaCode: Area code
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { method, productId, areaCode } = req.body

    if (!method) {
      return res.status(400).json({
        error: "Method is required",
      })
    }

    const shippingService = req.scope.resolve("shippingService")

    if (!shippingService) {
      return res.status(500).json({
        error: "Shipping service not available",
      })
    }

    // Validate the shipping method
    const isValid = await shippingService.validateShippingMethod({
      method,
      productId,
      areaCode,
    })

    return res.json({
      method,
      valid: isValid,
      message: isValid
        ? `Shipping method '${method}' is available`
        : `Shipping method '${method}' is not available for this configuration`,
    })
  } catch (error) {
    console.error("[Shipping API] Validation error:", error)
    return res.status(500).json({
      error: "Failed to validate shipping method",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
