import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus, XMark, Photo, Check, ArrowUpTray } from "@medusajs/icons"
import { Container, Heading, Button, Input, Text, clx, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import { sdk } from "../../lib/sdk"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Category = {
  id: string
  name: string
  handle: string
  description?: string
  parent_category_id?: string | null
  parent_category?: Category | null
  category_children?: Category[]
  metadata?: {
    image_url?: string
    icon?: string
  } | null
  rank: number
  is_active: boolean
}

type CategoriesResponse = {
  product_categories: Category[]
  count: number
  offset: number
  limit: number
}

// ─────────────────────────────────────────────
// Icon options
// ─────────────────────────────────────────────
const ICON_OPTIONS = [
  { name: "smartphone", label: "📱 Smartphone" },
  { name: "laptop", label: "💻 Laptop" },
  { name: "headphones", label: "🎧 Headphones" },
  { name: "watch", label: "⌚ Watch" },
  { name: "camera", label: "📷 Camera" },
  { name: "tv", label: "📺 TV" },
  { name: "gaming", label: "🎮 Gaming" },
  { name: "home", label: "🏠 Home" },
  { name: "kitchen", label: "🍳 Kitchen" },
  { name: "fashion", label: "👕 Fashion" },
  { name: "beauty", label: "💄 Beauty" },
  { name: "fitness", label: "💪 Fitness" },
  { name: "toys", label: "🧸 Toys" },
  { name: "automotive", label: "🚗 Automotive" },
  { name: "offroad", label: "🏍️ Offroad" },
  { name: "tools", label: "🔧 Tools" },
  { name: "battery", label: "🔋 Battery" },
  { name: "cable", label: "🔌 Cable" },
  { name: "speaker", label: "🔊 Speaker" },
  { name: "keyboard", label: "⌨️ Keyboard" },
  { name: "mouse", label: "🖱️ Mouse" },
  { name: "monitor", label: "🖥️ Monitor" },
  { name: "printer", label: "🖨️ Printer" },
  { name: "bag", label: "👜 Bag" },
  { name: "case", label: "📱 Case" },
]

// ─────────────────────────────────────────────
// Image Upload Modal
// ─────────────────────────────────────────────
const ImageModal = ({
  category,
  onClose,
  onSave,
}: {
  category: Category
  onClose: () => void
  onSave: (imageUrl: string, icon?: string) => void
}) => {
  const [imageUrl, setImageUrl] = useState(category.metadata?.image_url || "")
  const [selectedIcon, setSelectedIcon] = useState(category.metadata?.icon || "")
  const [uploading, setUploading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      const data = await response.json()
      if (data.files && data.files.length > 0) {
        setImageUrl(data.files[0].url)
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <Heading level="h2">Edit Category Image</Heading>
          <Button variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <div className="mb-4">
          <Text className="mb-2 font-medium">Category: {category.name}</Text>
          <Text className="text-sm text-gray-500">Handle: /{category.handle}</Text>
        </div>

        {/* Image Preview */}
        <div className="mb-4">
          <Text className="mb-2 text-sm font-medium">Image Preview</Text>
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
            {imageUrl && !previewError ? (
              <img
                src={imageUrl}
                alt={category.name}
                className="h-full w-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <Photo className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <ArrowUpTray className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>

        {/* Or paste URL */}
        <div className="mb-4">
          <Text className="mb-2 text-sm font-medium">Or paste image URL</Text>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setPreviewError(false)
            }}
          />
        </div>

        {/* Icon Selection */}
        <div className="mb-4">
          <Text className="mb-2 text-sm font-medium">Icon (optional)</Text>
          <div className="grid max-h-32 grid-cols-5 gap-2 overflow-y-auto rounded border p-2">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon.name}
                onClick={() => setSelectedIcon(icon.name)}
                className={clx(
                  "rounded p-2 text-center text-sm transition-colors",
                  selectedIcon === icon.name
                    ? "bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={icon.label}
              >
                {icon.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(imageUrl, selectedIcon)}
          >
            <Check className="mr-1 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
const CategoryImagesPage = () => {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Fetch categories
  const { data, isLoading, error } = useQuery<CategoriesResponse>({
    queryKey: ["admin-categories"],
    queryFn: () =>
      sdk.client.fetch("/admin/product-categories?limit=500&include_descendants_tree=true", {
        method: "GET",
      }),
  })

  const categories = data?.product_categories || []

  // Filter to main categories (no parent)
  const mainCategories = categories.filter((c) => !c.parent_category_id)

  // Build children map
  const childrenMap: Record<string, Category[]> = {}
  categories.forEach((cat) => {
    if (cat.parent_category_id) {
      if (!childrenMap[cat.parent_category_id]) {
        childrenMap[cat.parent_category_id] = []
      }
      childrenMap[cat.parent_category_id].push(cat)
    }
  })

  // Update category image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({
      id,
      image_url,
      icon,
    }: {
      id: string
      image_url: string
      icon?: string
    }) => {
      const response = await fetch(`/admin/categories/${id}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image_url, icon }),
      })
      if (!response.ok) throw new Error("Failed to update image")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      setSelectedCategory(null)
    },
  })

  const handleSaveImage = (imageUrl: string, icon?: string) => {
    if (!selectedCategory) return
    updateImageMutation.mutate({
      id: selectedCategory.id,
      image_url: imageUrl,
      icon,
    })
  }

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Filter categories by search
  const filteredMainCategories = search
    ? mainCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.handle.toLowerCase().includes(search.toLowerCase())
      )
    : mainCategories

  // Render category row
  const renderCategory = (category: Category, level: number = 0) => {
    const children = childrenMap[category.id] || []
    const hasChildren = children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const hasImage = !!category.metadata?.image_url

    return (
      <div key={category.id}>
        <div
          className={clx(
            "flex items-center gap-3 border-b border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800",
            level > 0 && "bg-gray-50/50 dark:bg-gray-900/50"
          )}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Image Thumbnail */}
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {category.metadata?.image_url ? (
              <img
                src={category.metadata.image_url}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <Photo className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Text className="font-medium">{category.name}</Text>
              {category.metadata?.icon && (
                <Badge color="grey" className="text-xs">
                  {ICON_OPTIONS.find((i) => i.name === category.metadata?.icon)?.label.split(" ")[0] || ""}
                </Badge>
              )}
              {hasImage && (
                <Badge color="green" className="text-xs">
                  Has Image
                </Badge>
              )}
            </div>
            <Text className="text-xs text-gray-500">/{category.handle}</Text>
          </div>

          {/* Children count */}
          {hasChildren && (
            <Badge color="grey" className="text-xs">
              {children.length} subcategories
            </Badge>
          )}

          {/* Edit Button */}
          <Button
            variant="secondary"
            size="small"
            onClick={() => setSelectedCategory(category)}
          >
            <Photo className="mr-1 h-3 w-3" />
            {hasImage ? "Edit" : "Add"} Image
          </Button>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {children
              .sort((a, b) => a.rank - b.rank)
              .map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="py-8 text-center text-red-500">
          Failed to load categories: {(error as Error).message}
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Heading level="h1">Category Images</Heading>
          <Text className="text-gray-500">
            Add images to categories for the mega menu navigation
          </Text>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4">
        <Badge color="grey">
          {categories.length} Total Categories
        </Badge>
        <Badge color="green">
          {categories.filter((c) => c.metadata?.image_url).length} With Images
        </Badge>
        <Badge color="orange">
          {categories.filter((c) => !c.metadata?.image_url).length} Without Images
        </Badge>
      </div>

      {/* Categories List */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading categories...</div>
        ) : filteredMainCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No categories found</div>
        ) : (
          filteredMainCategories
            .sort((a, b) => a.rank - b.rank)
            .map((category) => renderCategory(category))
        )}
      </div>

      {/* Image Modal */}
      {selectedCategory && (
        <ImageModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onSave={handleSaveImage}
        />
      )}
    </Container>
  )
}

// ─────────────────────────────────────────────
// Route Config
// ─────────────────────────────────────────────
export const config = defineRouteConfig({
  label: "Category Images",
  icon: SquaresPlus,
})

export default CategoryImagesPage
