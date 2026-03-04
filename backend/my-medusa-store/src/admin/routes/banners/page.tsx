import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import { Container, Heading, Button, Input, Switch, createDataTableColumnHelper, DataTable, DataTablePaginationState, useDataTable, Drawer } from "@medusajs/ui"
import { useRef } from "react"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

// Simple Banner type with image_url
type Banner = {
  id: string
  title?: string | null
  position?: string | null
  link?: string | null
  is_active: boolean
  display_order?: number
  image_url?: string | null
  start_at?: string | null
  end_at?: string | null
}

type BannersResponse = {
  banners: Banner[]
  count: number
}

const columnHelper = createDataTableColumnHelper<Banner>()

const BannersPage = () => {
  const limit = 20
  const [pagination, setPagination] = useState<DataTablePaginationState>({ pageSize: limit, pageIndex: 0 })
  const offset = useMemo(() => pagination.pageIndex * limit, [pagination])

  const { data, isLoading, refetch } = useQuery<BannersResponse>({
    queryFn: () => sdk.client.fetch("/admin/banners", { query: { limit, offset } }),
    queryKey: [["admin-banners", limit, offset]],
  })

  // Create Banner state
  const [openCreate, setOpenCreate] = useState(false)
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({ is_active: true, position: "hero" })
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setCreateError(null)
    try {
      console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type)
      const form = new FormData()
      form.append("file", file)
      
      // Use relative URL so it works on both localhost and production
      // The admin dashboard is served from the same origin as the backend
      const response = await fetch("/admin/uploads", {
        method: "POST",
        body: form,
        // include credentials for admin auth
        credentials: "include",
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }
      
      const uploaded = await response.json()
      console.log("Upload success:", uploaded)
      setNewBanner((p) => ({ ...p, image_url: uploaded.url }))
    } catch (err: any) {
      console.error("Upload error:", err)
      setCreateError("Upload failed: " + (err?.message || "Unknown error"))
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    setCreateError(null)
    if (!newBanner.position) {
      setCreateError("Please choose a position.")
      return
    }
    if (!newBanner.image_url) {
      setCreateError("Please upload an image.")
      return
    }
    setSubmitting(true)
    try {
      console.log("Creating banner:", newBanner)
  await sdk.client.fetch("/admin/banners", { method: "POST", body: newBanner })
      setOpenCreate(false)
      setNewBanner({ is_active: true, position: "hero" })
      await refetch()
    } catch (e: any) {
      console.error("Create error:", e)
      setCreateError(e?.message || "Failed to create banner.")
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    columnHelper.accessor("id", { header: "ID", cell: ({ getValue }) => getValue().substring(0, 8) + "..." }),
    columnHelper.accessor("title", { header: "Title" }),
    columnHelper.accessor("position", { header: "Position" }),
    columnHelper.accessor("is_active", { 
      header: "Active", 
      cell: ({ getValue }) => getValue() ? "✓" : "✗" 
    }),
    columnHelper.display({
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const b = row.original
        return b.image_url ? (
          <img src={b.image_url} alt={b.title || ""} className="w-16 h-10 object-cover rounded" />
        ) : (
          <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">No image</div>
        )
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex gap-2">
            <Button 
              size="small" 
              variant="danger" 
              onClick={async () => {
                if (confirm("Delete this banner?")) {
                  await sdk.client.fetch(`/admin/banners/${b.id}`, { method: "DELETE" })
                  await refetch()
                }
              }}
            >
              Delete
            </Button>
          </div>
        )
      },
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.banners || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Banners</Heading>
          <Button variant="primary" onClick={() => setOpenCreate(true)}>Create Banner</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* Simple Create Banner Drawer */}
      <Drawer open={openCreate} onOpenChange={setOpenCreate}>
        <Drawer.Header>
          <Drawer.Title>Create Banner</Drawer.Title>
          <Drawer.Description>Upload image and set position</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            {/* Position dropdown */}
            <div>
              <label className="text-sm font-medium">Position *</label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={newBanner.position || "hero"}
                onChange={(e) => setNewBanner((p) => ({ ...p, position: e.target.value }))}
              >
                <option value="hero">Hero (Top slider)</option>
                <option value="single">Single (Wide banner)</option>
                <option value="dual">Dual (Two tiles)</option>
                <option value="triple">Triple (Three tiles)</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium">Image *</label>
              <div className="mt-2 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                  }}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                
                {newBanner.image_url && (
                  <div className="border rounded p-3">
                    <img 
                      src={newBanner.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded mb-2" 
                    />
                    <div className="text-xs text-green-600">✓ Image uploaded successfully</div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional fields */}
            <Input 
              placeholder="Title (optional)" 
              value={newBanner.title || ""} 
              onChange={(e) => setNewBanner((p) => ({ ...p, title: e.target.value }))} 
            />
            <Input 
              placeholder="Link URL (optional)" 
              value={newBanner.link || ""} 
              onChange={(e) => setNewBanner((p) => ({ ...p, link: e.target.value }))} 
            />
            <div className="flex items-center gap-2">
              <Switch 
                checked={!!newBanner.is_active} 
                onCheckedChange={(v) => setNewBanner((p) => ({ ...p, is_active: v }))}
              />
              <span className="text-sm">Active</span>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {createError}
              </div>
            )}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button isLoading={submitting} onClick={handleCreate}>
            Create Banner
          </Button>
        </Drawer.Footer>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Banners", icon: TagSolid })
export default BannersPage