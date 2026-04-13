export interface ShippingOption {
  id: string
  name: string
  description: string
  price: number // in fils (KWD × 1000)
  estimatedDays: {
    min: number
    max: number
  }
  enabled: boolean
}

/**
 * Professional Shipping Service for Marqa Souq
 * 
 * Supports 3 shipping methods:
 * 1. Normal Delivery (2-3 days) - Always available - KWD 1.000
 * 2. Fast Delivery (Next day) - Area-specific - KWD 3.000
 * 3. Night Delivery (Same evening) - Product flag - KWD 5.000
 */
export class ShippingService {
  private logger: any
  private db: any

  constructor(options: any = {}) {
    this.logger = options.logger || console
    this.db = options.db
  }

  /**
   * Get available shipping methods for a cart + product + area
   */
  async getAvailableShipping(options: {
    cartId?: string
    productId?: string
    areaCode?: string
    weight?: number
    cartValue?: number
  }): Promise<ShippingOption[]> {
    try {
      const shippingOptions: ShippingOption[] = []

      // ALWAYS: Normal Delivery (Default option)
      shippingOptions.push({
        id: "normal",
        name: "Normal Delivery",
        description: "2-3 business days",
        price: 1000, // KWD 1.000 in fils
        estimatedDays: { min: 2, max: 3 },
        enabled: true,
      })

      // CONDITIONAL: Fast Delivery (by area)
      const isFastDeliveryArea = await this.isFastDeliveryArea(
        options.areaCode
      )
      if (isFastDeliveryArea) {
        shippingOptions.push({
          id: "fast",
          name: "Fast Delivery",
          description: "Next day delivery",
          price: 3000, // KWD 3.000 in fils
          estimatedDays: { min: 1, max: 1 },
          enabled: true,
        })
      }

      // CONDITIONAL: Night Delivery (if product allows)
      if (options.productId) {
        const allowNightDelivery = await this.productAllowsNightDelivery(
          options.productId
        )
        if (allowNightDelivery) {
          shippingOptions.push({
            id: "night",
            name: "Night Delivery",
            description: "Same day evening delivery",
            price: 5000, // KWD 5.000 in fils
            estimatedDays: { min: 0, max: 0.5 },
            enabled: true,
          })
        }
      }

      this.logger.info(
        `[Shipping] Available methods: ${shippingOptions.map((o) => o.id).join(", ")}`
      )

      return shippingOptions
    } catch (error) {
      this.logger.error("[Shipping] Error calculating available methods")
      // Fallback: return normal delivery only
      return [
        {
          id: "normal",
          name: "Normal Delivery",
          description: "2-3 business days",
          price: 1000,
          estimatedDays: { min: 2, max: 3 },
          enabled: true,
        },
      ]
    }
  }

  /**
   * Check if a specific area supports fast delivery
   * 
   * Areas that support Fast Delivery:
   * - Kuwait City (central)
   * - Salmiya (seaside)
   * - Farwaniya
   * - Jahra
   * - Ahmadi
   * 
   * Can be extended to load from database/config
   */
  private async isFastDeliveryArea(areaCode?: string): Promise<boolean> {
    if (!areaCode) return false

    // List of areas supporting fast delivery
    const fastDeliveryAreas = [
      "kuwait-city",
      "salmiya",
      "farwaniya",
      "jahra",
      "ahmadi",
      "mubarak-al-kabeer",
      "hawalli",
      "abbasiya",
    ]

    return fastDeliveryAreas.includes(areaCode.toLowerCase().replace(/\s+/g, "-"))
  }

  /**
   * Check if a product allows night delivery
   * Reads the allow_night_delivery flag from product metadata
   */
  private async productAllowsNightDelivery(productId: string): Promise<boolean> {
    try {
      // Query product directly from database
      if (this.db) {
        const result = await this.db.raw(
          `SELECT metadata FROM product WHERE id = ? LIMIT 1`,
          [productId]
        )

        if (result.rows?.length > 0) {
          const metadata = result.rows[0].metadata
          const allowNightDelivery = metadata?.allow_night_delivery ?? false
          this.logger?.debug?.(`[Shipping] Night delivery for ${productId}: ${allowNightDelivery}`)
          return Boolean(allowNightDelivery)
        }
      }

      this.logger?.warn?.(`[Shipping] Product not found: ${productId}`)
      return false
    } catch (error) {
      this.logger?.error?.(`[Shipping] Error checking night delivery for product ${productId}`)
      return false
    }
  }

  /**
   * Calculate shipping price based on method and cart details
   * 
   * Can be extended to include:
   * - Weight-based surcharges
   * - Value-based discounts
   * - Fragile item handling
   * - Bulk order surcharges
   */
  async calculateShippingPrice(options: {
    method: "normal" | "fast" | "night"
    weight?: number
    cartValue?: number
    itemCount?: number
  }): Promise<number> {
    const baseRates = {
      normal: 1000, // KWD 1.000
      fast: 3000, // KWD 3.000
      night: 5000, // KWD 5.000
    }

    let price = baseRates[options.method]

    // TODO: Add weight-based calculations
    // TODO: Add value-based discounts
    // TODO: Add item count surcharges

    return price
  }

  /**
   * Validate if a shipping method is available for a cart
   */
  async validateShippingMethod(options: {
    method: string
    productId?: string
    areaCode?: string
  }): Promise<boolean> {
    const available = await this.getAvailableShipping({
      productId: options.productId,
      areaCode: options.areaCode,
    })

    return available.some((opt) => opt.id === options.method && opt.enabled)
  }
}
