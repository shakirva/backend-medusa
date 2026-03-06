import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid, XMark } from "@medusajs/icons"
import { Container, Heading, Button, Input, Switch, createDataTableColumnHelper, DataTable, DataTablePaginationState, useDataTable, Drawer, FocusModal, Text } from "@medusajs/ui"
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

  // Edit Banner state
  const [openEdit, setOpenEdit] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null)
  const editFileInputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File, isEdit = false) => {
    setUploading(true)
    setCreateError(null)
    try {
      console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type)
      const form = new FormData()
      form.append("file", file)

      const response = await fetch("/admin/uploads", {
        method: "POST",
        body: form,
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }

      const uploaded = await response.json()
      console.log("Upload success:", uploaded)

      // Fix for different upload shapes (native vs custom)
      const resolvedUrl = uploaded.url || (uploaded.uploads && uploaded.uploads[0]?.url) || null

      if (isEdit) {
        setEditingBanner((p) => (p ? { ...p, image_url: resolvedUrl } : null))
      } else {
        setNewBanner((p) => ({ ...p, image_url: resolvedUrl }))
      }
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

  const handleUpdate = async () => {
    if (!editingBanner || !editingBanner.id) return
    setCreateError(null)
    setSubmitting(true)
    try {
      console.log("Updating banner:", editingBanner)
      await sdk.client.fetch(`/admin/banners/${editingBanner.id}`, {
        method: "PUT",
        body: editingBanner
      })
      setOpenEdit(false)
      setEditingBanner(null)
      await refetch()
    } catch (e: any) {
      console.error("Update error:", e)
      setCreateError(e?.message || "Failed to update banner.")
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    columnHelper.accessor("id", { header: "ID", cell: ({ getValue }) => <Text size="xsmall" className="text-ui-fg-subtle font-mono">{getValue().substring(0, 8)}...</Text> }),
    columnHelper.accessor("title", { header: "Title", cell: ({ getValue }) => getValue() || "-" }),
    columnHelper.accessor("position", { header: "Position", cell: ({ getValue }) => <span className="capitalize">{getValue()}</span> }),
    columnHelper.accessor("is_active", {
      header: "Active",
      cell: ({ getValue }) => getValue() ? <span className="text-green-600 font-bold">Active</span> : <span className="text-gray-400">Inactive</span>
    }),
    columnHelper.display({
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const b = row.original
        return b.image_url ? (
          <img src={b.image_url} alt={b.title || ""} className="w-20 h-12 object-cover rounded-md shadow-sm border border-ui-border-base" />
        ) : (
          <div className="w-20 h-12 bg-ui-bg-subtle rounded-md flex items-center justify-center text-[10px] text-ui-fg-muted uppercase">No image</div>
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
              variant="secondary"
              onClick={() => {
                setEditingBanner(b)
                setOpenEdit(true)
              }}
            >
              Edit
            </Button>
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
    <Container className="divide-y p-0 overflow-hidden">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center px-6 py-4">
          <Heading level="h1">Banners Management</Heading>
          <Button variant="primary" onClick={() => setOpenCreate(true)}>+ Create Banner</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* Create Banner Drawer */}
      <Drawer open={openCreate} onOpenChange={setOpenCreate}>
        <Drawer.Header>
          <Drawer.Title>Create New Banner</Drawer.Title>
          <Drawer.Description>Configure banner position and visuals</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="bg-ui-bg-subtle">
          <div className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-semibold text-ui-fg-base">Position *</label>
              <select
                className="w-full bg-ui-bg-base border border-ui-border-base rounded-md px-3 py-2 outline-none focus:border-ui-border-interactive transition-colors"
                value={newBanner.position || "hero"}
                onChange={(e) => setNewBanner((p) => ({ ...p, position: e.target.value }))}
              >
                <option value="hero">Hero Slider (Home Top)</option>
                <option value="single">Single Wide Banner</option>
                <option value="dual">Dual Side-by-Side Banners</option>
                <option value="triple">Triple Grid Banners</option>
                <option value="hot_deal">Hot Deal Banner</option>
              </select>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-semibold text-ui-fg-base">Banner Image *</label>
              <div className="space-y-4">
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
                  className="w-full border-dashed"
                >
                  {uploading ? "Uploading..." : "Click to select image"}
                </Button>

                {newBanner.image_url && (
                  <div className="relative border border-ui-border-base rounded-lg p-2 bg-ui-bg-base overflow-hidden">
                    <img
                      src={newBanner.image_url}
                      alt="Preview"
                      className="w-full aspect-video object-cover rounded-md"
                    />
                    <div className="mt-2 text-xs font-medium text-ui-fg-interactive">✓ Ready to save</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-semibold text-ui-fg-base">Title</label>
              <Input
                placeholder="Market campaign title..."
                value={newBanner.title || ""}
                onChange={(e) => setNewBanner((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-semibold text-ui-fg-base">Target URL</label>
              <Input
                placeholder="https://..."
                value={newBanner.link || ""}
                onChange={(e) => setNewBanner((p) => ({ ...p, link: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-x-3 p-3 bg-ui-bg-base border border-ui-border-base rounded-md">
              <Switch
                checked={!!newBanner.is_active}
                onCheckedChange={(v) => setNewBanner((p) => ({ ...p, is_active: v }))}
              />
              <span className="text-sm font-medium">Publish immediately</span>
            </div>

            {createError && (
              <div className="p-3 bg-ui-bg-error border border-ui-border-error rounded-md text-ui-fg-error text-xs">
                {createError}
              </div>
            )}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button isLoading={submitting} onClick={handleCreate} disabled={!newBanner.image_url}>
            Save Banner
          </Button>
        </Drawer.Footer>
      </Drawer>

      {/* Edit Banner Modal - FocusModal for Centered Experience */}
      <FocusModal open={openEdit} onOpenChange={(v) => { if (!v) { setOpenEdit(false); setEditingBanner(null); } }}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-between w-full">
              <Heading level="h1">Edit Banner Asset</Heading>
              <div className="flex items-center gap-x-2">
                <Button variant="secondary" onClick={() => setOpenEdit(false)} size="small">
                  <XMark />
                </Button>
              </div>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="bg-ui-bg-subtle flex flex-col items-center py-12 px-6 overflow-y-auto">
            {editingBanner && (
              <div className="w-full max-w-[640px] flex flex-col gap-y-10">
                <div className="bg-ui-bg-base border border-ui-border-base rounded-xl p-8 shadow-sm">
                  <div className="flex flex-col gap-y-8">
                    <div className="flex flex-col gap-y-2">
                      <Heading level="h2">Configuration</Heading>
                      <Text className="text-ui-fg-subtle">Update the banner placement and target link.</Text>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6">
                      <div className="flex flex-col gap-y-2">
                        <label className="text-sm font-semibold text-ui-fg-base">Position *</label>
                        <select
                          className="w-full bg-ui-bg-base border border-ui-border-base rounded-md px-3 py-2 outline-none focus:border-ui-border-interactive transition-colors"
                          value={editingBanner.position || "hero"}
                          onChange={(e) => setEditingBanner((p) => (p ? { ...p, position: e.target.value } : null))}
                        >
                          <option value="hero">Hero Slider (Home Top)</option>
                          <option value="single">Single Wide Banner</option>
                          <option value="dual">Dual Side-by-Side Banners</option>
                          <option value="triple">Triple Grid Banners</option>
                          <option value="hot_deal">Hot Deal Banner</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-y-2">
                        <label className="text-sm font-semibold text-ui-fg-base">Visual Asset *</label>
                        <div className="space-y-4">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(file, true)
                            }}
                          />

                          {editingBanner.image_url && (
                            <div className="group relative border border-ui-border-base rounded-lg p-3 bg-ui-bg-subtle overflow-hidden">
                              <img
                                src={editingBanner.image_url}
                                alt="Current"
                                className="w-full aspect-video object-cover rounded-md group-hover:opacity-50 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="small" onClick={() => editFileInputRef.current?.click()}>
                                  Replace Image
                                </Button>
                              </div>
                            </div>
                          )}

                          <Button
                            variant="secondary"
                            onClick={() => editFileInputRef.current?.click()}
                            isLoading={uploading}
                            className="w-full"
                          >
                            {uploading ? "Uploading..." : editingBanner.image_url ? "Change Asset" : "Upload Asset"}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-y-2">
                        <label className="text-sm font-semibold text-ui-fg-base">Title</label>
                        <Input
                          placeholder="Market campaign title..."
                          value={editingBanner.title || ""}
                          onChange={(e) => setEditingBanner((p) => (p ? { ...p, title: e.target.value } : null))}
                        />
                      </div>

                      <div className="flex flex-col gap-y-2">
                        <label className="text-sm font-semibold text-ui-fg-base">Target URL</label>
                        <Input
                          placeholder="https://..."
                          value={editingBanner.link || ""}
                          onChange={(e) => setEditingBanner((p) => (p ? { ...p, link: e.target.value } : null))}
                        />
                      </div>

                      <div className="flex items-center gap-x-3 p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
                        <Switch
                          checked={!!editingBanner.is_active}
                          onCheckedChange={(v) => setEditingBanner((p) => (p ? { ...p, is_active: v } : null))}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Active Status</span>
                          <span className="text-xs text-ui-fg-subtle">Is this banner currently visible to customers?</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {createError && (
                  <div className="p-4 bg-ui-bg-error border border-ui-border-error rounded-xl text-ui-fg-error text-sm">
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-x-3">
                  <Button variant="secondary" onClick={() => setOpenEdit(false)}>
                    Cancel
                  </Button>
                  <Button isLoading={submitting} onClick={handleUpdate} size="large" className="min-w-[120px]">
                    Update Banner
                  </Button>
                </div>
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}


export const config = defineRouteConfig({ label: "Banners", icon: TagSolid })
export default BannersPage