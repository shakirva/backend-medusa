import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo, PencilSquare } from "@medusajs/icons"
import { Container, Heading, Button, Input, createDataTableColumnHelper, DataTable, DataTablePaginationState, useDataTable, Drawer, Badge } from "@medusajs/ui"
import { useRef, useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Media = {
  id: string
  url?: string | null
  mime_type?: string | null
  title?: string | null
  title_ar?: string | null
  thumbnail_url?: string | null
  brand?: string | null
  views?: number | null
  display_order?: number | null
  is_featured?: boolean | null
  product_ids?: string[]
}

type MediaResponse = { media: Media[]; count: number }

type Brand = {
  id: string
  name: string
  logo_url?: string | null
  is_active: boolean
}

type Product = {
  id: string
  title: string
  thumbnail?: string | null
  handle?: string | null
}

const columnHelper = createDataTableColumnHelper<Media>()

// ─── Brand Logo Picker ────────────────────────────────────────────────────────
const BrandLogoPicker = ({
  value,
  onChange,
}: {
  value: string
  onChange: (name: string) => void
}) => {
  const [open, setOpen] = useState(false)

  const { data } = useQuery<{ brands: Brand[] }>({
    queryKey: ["admin-brands-picker"],
    queryFn: () => sdk.client.fetch("/admin/brands", { method: "GET" }),
    staleTime: 60_000,
  })
  const brands = data?.brands ?? []
  const selected = brands.find((b) => b.name === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-left"
      >
        {selected ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {selected.logo_url ? (
                <img src={selected.logo_url} alt={selected.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{selected.name[0]}</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">{selected.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-400">Select brand logo…</span>
        )}
        <svg className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">✕</span>
              Clear selection
            </button>
            <div className="max-h-64 overflow-y-auto p-2 grid grid-cols-2 gap-2">
              {brands.length === 0 && (
                <p className="col-span-2 text-center text-xs text-gray-400 py-4">No brands found</p>
              )}
              {brands.map((brand) => {
                const isSelected = brand.name === value
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => { onChange(brand.name); setOpen(false) }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${isSelected ? "border-violet-400 bg-violet-50" : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">{brand.name[0]}</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium truncate ${isSelected ? "text-violet-700" : "text-gray-700"}`}>
                      {brand.name}
                    </span>
                    {isSelected && (
                      <svg className="ml-auto w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Product Search Picker ────────────────────────────────────────────────────
const ProductPicker = ({
  selectedIds,
  onChange,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) => {
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery<{ products: Product[]; count: number }>({
    queryKey: ["admin-products-picker", search],
    queryFn: () => sdk.client.fetch(`/admin/products?q=${encodeURIComponent(search)}&limit=20`, { method: "GET" }),
    staleTime: 30_000,
  })
  const products = data?.products ?? []

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div>
      <Input
        placeholder="Search products to link…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedIds.map((id) => {
            const p = products.find((x) => x.id === id)
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                {p?.title || id.substring(0, 12) + "…"}
                <button type="button" onClick={() => toggle(id)} className="ml-0.5 hover:text-red-500">×</button>
              </span>
            )
          })}
        </div>
      )}
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {isLoading && <div className="p-3 text-xs text-gray-400 text-center">Loading…</div>}
        {!isLoading && products.length === 0 && <div className="p-3 text-xs text-gray-400 text-center">No products found</div>}
        {products.map((p) => {
          const checked = selectedIds.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${checked ? "bg-violet-50" : ""}`}
            >
              <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-200" />}
              </div>
              <span className="text-xs text-gray-800 flex-1 truncate">{p.title}</span>
              {checked && <span className="text-violet-500 text-sm">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Brand Cell (table) ───────────────────────────────────────────────────────
const BrandCell = ({ name }: { name: string | null | undefined }) => {
  const { data } = useQuery<{ brands: Brand[] }>({
    queryKey: ["admin-brands-picker"],
    queryFn: () => sdk.client.fetch("/admin/brands", { method: "GET" }),
    staleTime: 60_000,
  })
  const brand = (data?.brands ?? []).find((b) => b.name === name)

  return (
    <div className="flex items-center gap-2">
      {brand?.logo_url ? (
        <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain" />
        </div>
      ) : null}
      <span className="text-sm">{name || "Markasouq"}</span>
    </div>
  )
}

const MediaPage = () => {
  const limit = 50
  const [pagination, setPagination] = useState<DataTablePaginationState>({ pageSize: limit, pageIndex: 0 })
  const offset = useMemo(() => pagination.pageIndex * limit, [pagination])

  const { data, isLoading, refetch } = useQuery<MediaResponse>({
    queryFn: () => sdk.client.fetch('/admin/media', { query: { limit, offset } }),
    queryKey: [['admin-media', limit, offset]],
  })

  const [openCreate, setOpenCreate] = useState(false)
  const [newMedia, setNewMedia] = useState<Partial<Media>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [openEdit, setOpenEdit] = useState(false)
  const [editMedia, setEditMedia] = useState<Partial<Media>>({})
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editMessage, setEditMessage] = useState<string | null>(null)
  // ──────────────────────────────────────────────────────────────────────────
  // Keep a ref mirror of newMedia so async handlers always read fresh values
  const newMediaRef = useRef<Partial<Media>>({})

  const closeAll = () => {
    setOpenCreate(false)
    setOpenEdit(false)
    setMessage(null)
    setEditMessage(null)
    newMediaRef.current = {}
    setNewMedia({})
  }

  const updateNewMedia = (updater: (prev: Partial<Media>) => Partial<Media>) => {
    setNewMedia((prev) => {
      const next = updater(prev)
      newMediaRef.current = next
      return next
    })
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)

      let uploadedUrl = ''
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `/admin/media/upload`)
        xhr.withCredentials = true
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText)
              uploadedUrl = resp.url || ''
              newMediaRef.current = { ...newMediaRef.current, url: uploadedUrl, mime_type: file.type }
              updateNewMedia((p) => ({ ...p, url: uploadedUrl, mime_type: file.type }))
              resolve()
            } catch { reject(new Error('Invalid upload response')) }
          } else { reject(new Error(`Upload failed ${xhr.status}`)) }
        }
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(form)
      })

      // Auto-save the record immediately after upload
      setSubmitting(true)
      setMessage('Saving…')
      const snap = newMediaRef.current
      const payload: any = {
        url: uploadedUrl,
        title: snap.title || file.name,
        title_ar: snap.title_ar || null,
        mime_type: file.type,
        brand: snap.brand || 'Markasouq',
        views: snap.views || 0,
        display_order: snap.display_order || 0,
        is_featured: snap.is_featured || false,
        product_ids: snap.product_ids || [],
      }
      const res = await fetch('/admin/media', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Save failed (${res.status}): ${errText}`)
      }
      setMessage('✅ Media created successfully!')
      setOpenCreate(false)
      newMediaRef.current = {}
      setNewMedia({})
      await refetch()
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Upload failed'}`)
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return
    await sdk.client.fetch(`/admin/media/${id}`, { method: 'DELETE' })
    await refetch()
  }

  const handleEditOpen = (item: Media) => {
    closeAll()
    setEditMedia({ ...item })
    setOpenEdit(true)
  }

  const handleEditSave = async () => {
    if (!editMedia.id) return
    setEditSubmitting(true)
    setEditMessage(null)
    try {
      const res = await fetch(`/admin/media/${editMedia.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editMedia.title || '',
          title_ar: editMedia.title_ar || null,
          brand: editMedia.brand || 'Markasouq',
          views: editMedia.views || 0,
          display_order: editMedia.display_order || 0,
          is_featured: editMedia.is_featured || false,
          product_ids: editMedia.product_ids || [],
          thumbnail_url: editMedia.thumbnail_url || null,
        }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(`Save failed (${res.status}): ${t}`)
      }
      setEditMessage('✅ Saved successfully!')
      await refetch()
      setTimeout(() => { setOpenEdit(false); setEditMessage(null) }, 800)
    } catch (e: any) {
      setEditMessage(`❌ ${e?.message || 'Failed to save'}`)
    } finally {
      setEditSubmitting(false)
    }
  }

  const columns = [
    columnHelper.accessor('id', { header: 'ID', cell: ({ getValue }) => getValue().substring(0, 8) + '...' }),
    columnHelper.accessor('title', { header: 'Title', cell: ({ getValue }) => getValue() || '-' }),
    columnHelper.display({ id: 'brand', header: 'Brand', cell: ({ row }) => <BrandCell name={row.original.brand} /> }),
    columnHelper.display({
      id: 'type', header: 'Type', cell: ({ row }) => (
        <Badge color={row.original.mime_type?.startsWith('video') ? 'purple' : 'blue'}>
          {row.original.mime_type?.startsWith('video') ? 'Video' : 'Image'}
        </Badge>
      )
    }),
    columnHelper.display({
      id: 'preview', header: 'Preview', cell: ({ row }) => (
        row.original.mime_type && row.original.mime_type.startsWith('video') ? (
          <video src={row.original.url || ''} poster={row.original.thumbnail_url || undefined} className="w-24 h-16 object-contain" controls />
        ) : (
          row.original.url ? <img src={row.original.url} className="w-24 h-16 object-contain" /> : <div className="w-24 h-16 bg-gray-100" />
        )
      )
    }),
    columnHelper.display({
      id: 'products', header: 'Products', cell: ({ row }) => (
        <span className="text-xs text-gray-500">{(row.original.product_ids?.length || 0)} linked</span>
      )
    }),
    columnHelper.accessor('views', { header: 'Views', cell: ({ getValue }) => getValue() || 0 }),
    columnHelper.accessor('display_order', { header: 'Order', cell: ({ getValue }) => getValue() || 0 }),
    columnHelper.display({
      id: 'featured', header: 'Featured', cell: ({ row }) => (
        row.original.is_featured ? <Badge color="green">Yes</Badge> : <span className="text-gray-400">No</span>
      )
    }),
    columnHelper.display({
      id: 'actions', header: 'Actions', cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="small" variant="secondary" onClick={() => handleEditOpen(row.original)}>
            <PencilSquare className="mr-1" />Edit
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDelete(row.original.id)}>Delete</Button>
        </div>
      )
    }),
  ]

  const table = useDataTable({ columns, data: data?.media || [], getRowId: (r) => r.id, rowCount: data?.count || 0, isLoading, pagination: { state: pagination, onPaginationChange: setPagination } })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between">
          <Heading>Media</Heading>
          <Button variant="primary" onClick={() => { closeAll(); setOpenCreate(true); }}>Create Media</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* ── Single Drawer — Create mode ─────────────────────────────── */}
      <Drawer open={openCreate} onOpenChange={(open) => { if (!open) closeAll() }}>
        <Drawer.Header>
          <Drawer.Title>Create Media</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            <Input placeholder="Title (English)" value={newMedia.title || ''} onChange={(e) => updateNewMedia((p) => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Title (Arabic)" value={newMedia.title_ar || ''} onChange={(e) => updateNewMedia((p) => ({ ...p, title_ar: e.target.value }))} dir="rtl" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
              <BrandLogoPicker value={newMedia.brand || ''} onChange={(name) => updateNewMedia((p) => ({ ...p, brand: name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Linked Products <span className="text-xs text-gray-400 font-normal">(shown on right side of video)</span>
              </label>
              <ProductPicker selectedIds={newMedia.product_ids || []} onChange={(ids) => updateNewMedia((p) => ({ ...p, product_ids: ids }))} />
            </div>
            <div className="flex items-center gap-3">
              <input id="isFeatured" type="checkbox" checked={!!newMedia.is_featured} onChange={(e) => updateNewMedia((p) => ({ ...p, is_featured: e.target.checked }))} />
              <label htmlFor="isFeatured" className="text-sm">Featured Video (show prominently)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Upload File <span className="text-xs text-gray-400 font-normal">(image or video — saves automatically)</span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleUpload(f) }}
                className="p-6 border-dashed border-2 border-gray-300 rounded-lg text-center hover:border-violet-400 transition-colors"
              >
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <p className="text-sm text-gray-500 mb-3">Drag &amp; drop an image or video here, or</p>
                <Button onClick={() => fileRef.current?.click()} isLoading={uploading || submitting} variant="secondary">
                  {uploading ? `Uploading ${progress}%…` : submitting ? 'Saving…' : 'Select File'}
                </Button>
              </div>
              {message && (
                <div className={`mt-2 text-sm px-3 py-2 rounded ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex gap-2 w-full justify-end">
            <Drawer.Close asChild>
              <Button variant="secondary" onClick={closeAll}>Cancel</Button>
            </Drawer.Close>
          </div>
        </Drawer.Footer>
      </Drawer>

      {/* ── Single Drawer — Edit mode ───────────────────────────────── */}
      <Drawer open={openEdit} onOpenChange={(open) => { if (!open) closeAll() }}>
        <Drawer.Header>
          <Drawer.Title>Edit Media</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            {editMedia.url && (
              <div className="flex justify-center bg-gray-50 rounded-lg p-3 border border-gray-200">
                {editMedia.mime_type?.startsWith('video') ? (
                  <video src={editMedia.url} poster={editMedia.thumbnail_url || undefined} className="max-h-40 rounded" controls />
                ) : (
                  <img src={editMedia.url} className="max-h-40 object-contain rounded" />
                )}
              </div>
            )}
            <Input placeholder="Title (English)" value={editMedia.title || ''} onChange={(e) => setEditMedia((p) => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Title (Arabic)" value={editMedia.title_ar || ''} onChange={(e) => setEditMedia((p) => ({ ...p, title_ar: e.target.value }))} dir="rtl" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
              <BrandLogoPicker value={editMedia.brand || ''} onChange={(name) => setEditMedia((p) => ({ ...p, brand: name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Linked Products <span className="text-xs text-gray-400 font-normal">(shown on right side of video)</span>
              </label>
              <ProductPicker selectedIds={editMedia.product_ids || []} onChange={(ids) => setEditMedia((p) => ({ ...p, product_ids: ids }))} />
            </div>
            <div className="flex items-center gap-3">
              <input id="editIsFeatured" type="checkbox" checked={!!editMedia.is_featured} onChange={(e) => setEditMedia((p) => ({ ...p, is_featured: e.target.checked }))} />
              <label htmlFor="editIsFeatured" className="text-sm">Featured Video (show prominently)</label>
            </div>
            {editMessage && (
              <div className={`text-sm px-3 py-2 rounded ${editMessage.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {editMessage}
              </div>
            )}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex gap-2 w-full justify-end">
            <Drawer.Close asChild>
              <Button variant="secondary" onClick={closeAll}>Cancel</Button>
            </Drawer.Close>
            <Button isLoading={editSubmitting} onClick={handleEditSave}>Save Changes</Button>
          </div>
        </Drawer.Footer>
      </Drawer>

    </Container>
  )
}

export const config = defineRouteConfig({ label: 'Media', icon: Photo })
export default MediaPage

