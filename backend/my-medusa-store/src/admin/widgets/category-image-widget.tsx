import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Photo, ArrowUpTray, XMark, Check } from "@medusajs/icons"
import { Container, Heading, Button, Input, Text, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import type { DetailWidgetProps, AdminProductCategory } from "@medusajs/framework/types"

// ─────────────────────────────────────────────
// Icon options (same as the standalone page)
// ─────────────────────────────────────────────
const ICON_OPTIONS = [
  { name: "mobile", label: "📱 Mobile" },
  { name: "laptop", label: "💻 Laptop" },
  { name: "tablet", label: "📟 Tablet" },
  { name: "tv", label: "📺 TV" },
  { name: "camera", label: "📷 Camera" },
  { name: "headphones", label: "🎧 Headphones" },
  { name: "gaming", label: "🎮 Gaming" },
  { name: "watch", label: "⌚ Watch" },
  { name: "home", label: "🏠 Home" },
  { name: "kitchen", label: "🍳 Kitchen" },
  { name: "fashion", label: "👗 Fashion" },
  { name: "beauty", label: "💄 Beauty" },
  { name: "sports", label: "⚽ Sports" },
  { name: "books", label: "📚 Books" },
  { name: "toys", label: "🧸 Toys" },
  { name: "car", label: "🚗 Car" },
  { name: "health", label: "💊 Health" },
  { name: "food", label: "🍎 Food" },
  { name: "tools", label: "🔧 Tools" },
  { name: "office", label: "📎 Office" },
  { name: "pet", label: "🐾 Pet" },
  { name: "baby", label: "👶 Baby" },
  { name: "music", label: "🎵 Music" },
  { name: "art", label: "🎨 Art" },
  { name: "travel", label: "✈️ Travel" },
]

// ─────────────────────────────────────────────
// Widget Component
// ─────────────────────────────────────────────
const CategoryImageWidget = ({ data }: DetailWidgetProps<AdminProductCategory>) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageUrl, setImageUrl] = useState<string>((data as any)?.metadata?.image_url || "")
  const [selectedIcon, setSelectedIcon] = useState<string>((data as any)?.metadata?.icon || "")
  const [uploading, setUploading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Also fetch fresh metadata from our custom endpoint
  const { data: imageData } = useQuery<{ image_url: string | null; icon: string | null }>({
    queryKey: ["category-image", data.id],
    queryFn: () =>
      fetch(`/admin/categories/${data.id}/image`, { credentials: "include" })
        .then((r) => r.json()),
    onSuccess: (d: any) => {
      if (d.image_url && !imageUrl) setImageUrl(d.image_url)
      if (d.icon && !selectedIcon) setSelectedIcon(d.icon)
    },
  } as any)

  // Use fetched data if local state not set yet
  const currentImageUrl = imageUrl || imageData?.image_url || ""
  const currentIcon = selectedIcon || imageData?.icon || ""

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setPreviewError(false)

    try {
      const formData = new FormData()
      formData.append("files", file)

      const response = await fetch("/admin/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) throw new Error("Upload failed")

      const uploadData = await response.json()
      const url =
        uploadData?.url ||
        uploadData?.files?.[0]?.url ||
        uploadData?.uploads?.[0]?.url ||
        null

      if (url) {
        setImageUrl(url)
        setPreviewError(false)
      } else {
        throw new Error("No URL returned")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image. Try pasting a URL instead.")
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/categories/${data.id}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          image_url: imageUrl,
          icon: selectedIcon || undefined,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Failed to save")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-image", data.id] })
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (err: Error) => {
      alert("Error saving image: " + err.message)
    },
  })

  // Remove image
  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/categories/${data.id}/image`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to remove")
      return response.json()
    },
    onSuccess: () => {
      setImageUrl("")
      setSelectedIcon("")
      setPreviewError(false)
      queryClient.invalidateQueries({ queryKey: ["category-image", data.id] })
    },
  })

  const isSaving = saveMutation.isPending
  const isRemoving = removeMutation.isPending

  return (
    <Container className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border-base">
        <div className="flex items-center gap-2">
          <Photo className="h-4 w-4 text-ui-fg-subtle" />
          <Heading level="h2" className="text-sm font-semibold">
            Category Image
          </Heading>
        </div>
        {currentImageUrl && (
          <Badge color="green" size="small">Has Image</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Image Preview */}
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-ui-border-base bg-ui-bg-subtle">
            {currentImageUrl && !previewError ? (
              <img
                src={currentImageUrl}
                alt={data.name}
                className="h-full w-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-ui-fg-muted gap-1">
                <Photo className="h-6 w-6" />
                <span className="text-[10px]">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Text className="text-xs text-ui-fg-subtle mb-1">Handle</Text>
            <Text className="text-xs font-mono text-ui-fg-base truncate">/{data.handle}</Text>
            {currentIcon && (
              <div className="mt-1 flex items-center gap-1">
                <Text className="text-xs text-ui-fg-subtle">Icon:</Text>
                <span className="text-sm">
                  {ICON_OPTIONS.find((i) => i.name === currentIcon)?.label?.split(" ")[0] || currentIcon}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="secondary"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <ArrowUpTray className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload Image"}
          </Button>
        </div>

        {/* URL Input */}
        <div>
          <Text className="text-xs text-ui-fg-subtle mb-1.5">Or paste image URL</Text>
          <Input
            type="url"
            size="small"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setPreviewError(false)
            }}
          />
        </div>

        {/* Icon Picker Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowIconPicker((v) => !v)}
            className="text-xs text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium flex items-center gap-1"
          >
            {showIconPicker ? "▲" : "▶"} {currentIcon ? `Icon: ${ICON_OPTIONS.find((i) => i.name === currentIcon)?.label?.split(" ")[0] || currentIcon}` : "Pick an icon (optional)"}
          </button>

          {showIconPicker && (
            <div className="mt-2 grid grid-cols-5 gap-1 max-h-28 overflow-y-auto rounded-lg border border-ui-border-base p-2 bg-ui-bg-subtle">
              {/* Clear icon option */}
              <button
                onClick={() => setSelectedIcon("")}
                className={`rounded p-1.5 text-center text-xs transition-colors ${
                  !selectedIcon
                    ? "bg-ui-bg-interactive ring-1 ring-ui-border-interactive"
                    : "hover:bg-ui-bg-base-hover"
                }`}
                title="No icon"
              >
                ✕
              </button>
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon.name}
                  onClick={() => setSelectedIcon(icon.name)}
                  className={`rounded p-1.5 text-center text-sm transition-colors ${
                    selectedIcon === icon.name
                      ? "bg-ui-bg-interactive ring-1 ring-ui-border-interactive"
                      : "hover:bg-ui-bg-base-hover"
                  }`}
                  title={icon.label}
                >
                  {icon.label.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="small"
            onClick={() => saveMutation.mutate()}
            disabled={isSaving || (!imageUrl && !selectedIcon)}
            className="flex-1"
          >
            {isSaving ? (
              "Saving…"
            ) : saved ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" /> Saved!
              </>
            ) : (
              "Save Image"
            )}
          </Button>

          {currentImageUrl && (
            <Button
              variant="danger"
              size="small"
              onClick={() => {
                if (confirm("Remove the image for this category?")) {
                  removeMutation.mutate()
                }
              }}
              disabled={isRemoving}
            >
              <XMark className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Info note */}
        <p className="text-[11px] text-ui-fg-muted leading-relaxed">
          This image appears in the mega menu and category pages on the storefront. Changes are saved immediately to the database.
        </p>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.before",
})

export default CategoryImageWidget
