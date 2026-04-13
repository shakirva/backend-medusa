import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Switch, Badge, Label } from "@medusajs/ui"
import { useState, useEffect } from "react"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

/**
 * Night Delivery Widget — appears on the product detail page sidebar.
 *
 * Reads / writes `night_delivery` (boolean) inside the product's
 * metadata JSONB column.  The toggle is instant — click to flip.
 *
 * The storefront product page already checks `metadata.night_delivery`
 * and shows the night-delivery option only when it's `true`.
 */
const NightDeliveryWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const meta = (product as any)?.metadata || {}
  const [enabled, setEnabled] = useState<boolean>(
    meta.night_delivery === true || meta.night_delivery === "true"
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync from props when product data changes (e.g. after Odoo webhook)
  useEffect(() => {
    const m = (product as any)?.metadata || {}
    setEnabled(m.night_delivery === true || m.night_delivery === "true")
  }, [(product as any)?.metadata?.night_delivery])

  const toggle = async (nextValue: boolean) => {
    setEnabled(nextValue)
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/admin/products/${product.id}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ night_delivery: nextValue }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `HTTP ${res.status}`)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      console.error("[Night Delivery] Save error:", err)
      setError(err.message || "Failed to save")
      // Revert toggle on error
      setEnabled(!nextValue)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <span className="text-lg">🌙</span>
          <Heading level="h2" className="text-ui-fg-base inter-small-semibold">
            Night Delivery
          </Heading>
        </div>
        {saved && (
          <Badge color="green" size="small">
            Saved ✓
          </Badge>
        )}
        {saving && (
          <Badge color="grey" size="small">
            Saving…
          </Badge>
        )}
      </div>

      {/* Toggle Row */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="night-delivery-toggle" className="text-ui-fg-base font-medium">
              Enable Night Delivery
            </Label>
            <Text className="text-ui-fg-subtle text-xs">
              {enabled
                ? "Customers can choose night delivery for this product"
                : "Night delivery is disabled for this product"}
            </Text>
          </div>
          <Switch
            id="night-delivery-toggle"
            checked={enabled}
            onCheckedChange={toggle}
            disabled={saving}
          />
        </div>

        {error && (
          <Text className="text-ui-fg-error text-xs mt-2">⚠ {error}</Text>
        )}
      </div>

      {/* Status Badge */}
      <div className="px-6 py-3 flex items-center gap-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <Text className="text-ui-fg-subtle text-xs">
          {enabled ? "Night delivery available" : "Standard delivery only"}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default NightDeliveryWidget
