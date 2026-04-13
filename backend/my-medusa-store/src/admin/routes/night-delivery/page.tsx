import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Moon } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Input } from "@medusajs/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

// ─── Types ───────────────────────────────────────────────────────────────────
type Product = {
  id: string
  title: string
  thumbnail: string | null
  status: string
  metadata: Record<string, any> | null
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const NightDeliveryPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  // Fetch all products (paginated)
  const { data, isLoading } = useQuery({
    queryKey: ["products-night-delivery"],
    queryFn: async () => {
      const res = await sdk.admin.product.list({ limit: 200, offset: 0 })
      return res
    },
  })

  const products: Product[] = (data as any)?.products ?? []

  // Filter by search
  const filtered = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  const isEnabled = (product: Product) => {
    const meta = product.metadata || {}
    return meta.night_delivery === true || meta.night_delivery === "true"
  }

  const toggle = async (product: Product, nextValue: boolean) => {
    setSaving((s) => ({ ...s, [product.id]: true }))
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
      // Optimistically update local cache
      queryClient.setQueryData(["products-night-delivery"], (old: any) => {
        if (!old?.products) return old
        return {
          ...old,
          products: old.products.map((p: Product) =>
            p.id === product.id
              ? { ...p, metadata: { ...(p.metadata || {}), night_delivery: nextValue } }
              : p
          ),
        }
      })
      setSavedIds((s) => ({ ...s, [product.id]: true }))
      setTimeout(() => setSavedIds((s) => ({ ...s, [product.id]: false })), 2000)
    } catch (err: any) {
      console.error("[Night Delivery] toggle error:", err)
      alert("Failed to save: " + (err.message || "unknown error"))
    } finally {
      setSaving((s) => ({ ...s, [product.id]: false }))
    }
  }

  const enabledCount = products.filter(isEnabled).length

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <Heading level="h1" className="text-2xl font-bold text-gray-900">
            Night Delivery
          </Heading>
        </div>
        <Text className="text-ui-fg-subtle">
          Toggle night delivery eligibility per product. Only products with Night Delivery <strong>ON</strong> will show the night delivery option at checkout.
        </Text>
        <div className="mt-2 flex gap-3">
          <Badge color="green" size="base">{enabledCount} Enabled</Badge>
          <Badge color="grey" size="base">{products.length - enabledCount} Disabled</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product Table */}
      <Container className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-ui-fg-subtle">
            Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-ui-fg-subtle">
            No products found.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-subtle uppercase tracking-wider w-16">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-subtle uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-subtle uppercase tracking-wider w-28">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-ui-fg-subtle uppercase tracking-wider w-40">
                  🌙 Night Delivery
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border-base">
              {filtered.map((product) => {
                const enabled = isEnabled(product)
                const isSaving = saving[product.id]
                const isSaved = savedIds[product.id]
                return (
                  <tr
                    key={product.id}
                    className="bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 border border-ui-border-base flex items-center justify-center">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">No img</span>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <Text className="text-sm font-medium text-ui-fg-base line-clamp-2">
                        {product.title}
                      </Text>
                      <Text className="text-xs text-ui-fg-subtle mt-0.5">{product.id}</Text>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        color={product.status === "published" ? "green" : "grey"}
                        size="small"
                      >
                        {product.status}
                      </Badge>
                    </td>

                    {/* Night Delivery Toggle */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggle(product, !enabled)}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                            enabled ? "bg-blue-600" : "bg-gray-200"
                          }`}
                          title={enabled ? "Click to disable night delivery" : "Click to enable night delivery"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            enabled ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {isSaving ? "Saving…" : isSaved ? "Saved ✓" : enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Night Delivery",
  icon: Moon,
})

export default NightDeliveryPage
