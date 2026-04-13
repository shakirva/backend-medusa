import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useState } from "react"

/**
 * Delete Order Widget — appears on the order detail page.
 * Provides a button to permanently delete the order.
 */
const DeleteOrderWidget = ({ data }: { data: any }) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)

  const orderId = data?.id
  const displayId = data?.display_id

  const handleDelete = async () => {
    if (!orderId) return

    const confirmed = window.confirm(
      `Are you sure you want to delete Order #${displayId || orderId}?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/admin/orders/${orderId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `HTTP ${res.status}`)
      }

      setDeleted(true)
      // Redirect to orders list after short delay
      setTimeout(() => {
        window.location.href = "/app/orders"
      }, 1500)
    } catch (err: any) {
      console.error("[Delete Order] Error:", err)
      setError(err.message || "Failed to delete order")
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) {
    return (
      <Container className="p-0">
        <div className="px-6 py-4">
          <div className="flex items-center gap-x-2">
            <span className="text-lg">✅</span>
            <Text className="text-ui-fg-base font-medium">
              Order #{displayId} deleted. Redirecting...
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-x-2">
            <span className="text-lg">🗑️</span>
            <Heading level="h2" className="text-ui-fg-base inter-small-semibold">
              Delete Order
            </Heading>
          </div>
        </div>

        <Text className="text-ui-fg-subtle text-xs mb-3">
          Permanently delete this order and all its associated data (items,
          shipping, transactions, fulfillments). This action cannot be undone.
        </Text>

        <Button
          variant="danger"
          size="small"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full"
        >
          {deleting ? "Deleting…" : `Delete Order #${displayId || ""}`}
        </Button>

        {error && (
          <Text className="text-ui-fg-error text-xs mt-2">⚠ {error}</Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default DeleteOrderWidget
