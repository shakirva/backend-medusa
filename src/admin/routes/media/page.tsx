import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo, Trash } from "@medusajs/icons"
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
}

type MediaResponse = { media: Media[]; count: number }

type Brand = {
  id: string
  name: string
  logo_url?: string | null
  is_active: boolean
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
      {/* Trigger */}
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

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">✕</span>
              Clear selection
            </button>

            {/* Brand grid */}
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${isSelected
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain"
                        />
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
  const [autoCreate, setAutoCreate] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const thumbRef = useRef<HTMLInputElement | null>(null)

  // Upload using XHR so we can get progress events and ensure credentials are sent
  const handleUpload = async (file: File, isThumbnail = false) => {
    setUploading(true)
    setProgress(0)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)

      let uploadedUrl: string | null = null
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `/admin/media/upload`)
        xhr.withCredentials = true
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const p = Math.round((ev.loaded / ev.total) * 100)
            setProgress(p)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              uploadedUrl = data.url
              if (isThumbnail) {
                setNewMedia((p) => ({ ...p, thumbnail_url: data.url }))
              } else {
                setNewMedia((p) => ({ ...p, url: data.url, mime_type: file.type }))
              }
              setMessage('Upload succeeded')
              resolve()
            } catch (e) {
              reject(new Error('Invalid upload response'))
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(form)
      })

      // Auto-create media record after upload if enabled (only for primary file)
      if (!isThumbnail && autoCreate && uploadedUrl) {
        try {
          setSubmitting(true)
          const payload: any = {
            url: uploadedUrl,
            title: newMedia.title || file.name,
            title_ar: newMedia.title_ar,
            mime_type: file.type,
            brand: newMedia.brand || 'Markasouq',
            views: newMedia.views || 0,
            display_order: newMedia.display_order || 0,
            is_featured: newMedia.is_featured || false
          }
          if (newMedia.thumbnail_url) payload.thumbnail_url = newMedia.thumbnail_url
          await sdk.client.fetch('/admin/media', { method: 'POST', body: payload })
          setMessage('Media record created')

          // Attachment to a gallery was intentionally removed from the create drawer.

          setOpenCreate(false)
          setNewMedia({})
          await refetch()
        } catch (e) {
          console.error('Auto-create failed', e)
          setMessage('Media created but failed to refresh list')
        } finally {
          setSubmitting(false)
        }
      }
    } catch (e: any) {
      console.error('Upload failed', e)
      setMessage(typeof e?.message === 'string' ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!newMedia.url) return
    setSubmitting(true)
    try {
      const payload: any = {
        url: newMedia.url,
        title: newMedia.title,
        title_ar: newMedia.title_ar,
        mime_type: newMedia.mime_type,
        brand: newMedia.brand || 'Markasouq',
        views: newMedia.views || 0,
        display_order: newMedia.display_order || 0,
        is_featured: newMedia.is_featured || false
      }
      if (newMedia.thumbnail_url) payload.thumbnail_url = newMedia.thumbnail_url
      await sdk.client.fetch('/admin/media', { method: 'POST', body: payload })
      setOpenCreate(false)
      setNewMedia({})
      await refetch()
    } catch (e) {
      console.error('Create media failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return
    await sdk.client.fetch(`/admin/media/${id}`, { method: 'DELETE' })
    await refetch()
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
          <Button variant="primary" onClick={() => setOpenCreate(true)}>Create Media</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <Drawer open={openCreate} onOpenChange={setOpenCreate}>
        <Drawer.Header>
          <Drawer.Title>Create Media</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            <Input placeholder="Title (English)" value={newMedia.title || ''} onChange={(e) => setNewMedia((p) => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Title (Arabic)" value={newMedia.title_ar || ''} onChange={(e) => setNewMedia((p) => ({ ...p, title_ar: e.target.value }))} dir="rtl" />

            {/* Brand Logo Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
              <BrandLogoPicker
                value={newMedia.brand || ''}
                onChange={(name) => setNewMedia((p) => ({ ...p, brand: name }))}
              />
              {/* Fallback manual input */}
              <input
                type="text"
                placeholder="Or type brand name manually"
                value={newMedia.brand || ''}
                onChange={(e) => setNewMedia((p) => ({ ...p, brand: e.target.value }))}
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-500 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Display Order" type="number" value={newMedia.display_order || 0} onChange={(e) => setNewMedia((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
              <Input placeholder="Initial Views" type="number" value={newMedia.views || 0} onChange={(e) => setNewMedia((p) => ({ ...p, views: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-3">
              <input id="isFeatured" type="checkbox" checked={!!newMedia.is_featured} onChange={(e) => setNewMedia((p) => ({ ...p, is_featured: e.target.checked }))} />
              <label htmlFor="isFeatured" className="text-sm">Featured Video (show prominently)</label>
            </div>
            <Input placeholder="Mime Type (auto-detected)" value={newMedia.mime_type || ''} onChange={(e) => setNewMedia((p) => ({ ...p, mime_type: e.target.value }))} />
            <div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer?.files?.[0]
                  if (f) handleUpload(f)
                }}
                className="p-4 border-dashed border-2 border-gray-300 rounded mb-3 text-center"
              >
                <div className="mb-2">Drag &amp; drop an image or video here, or</div>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <Button onClick={() => fileRef.current?.click()} isLoading={uploading} variant="secondary">Select File</Button>
              </div>

              {uploading && (
                <div className="mb-2">Uploading: {progress}%</div>
              )}

              {message && <div className="text-sm text-gray-600 mb-2">{message}</div>}

              <div className="flex items-center gap-3 mb-3">
                <input id="autoCreate" type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
                <label htmlFor="autoCreate" className="text-sm">Automatically create media record after upload</label>
              </div>

              {/* Gallery attachment removed from quick-create drawer per UX request. */}

              <div className="mb-3">
                <label className="text-sm block mb-1">Thumbnail (optional)</label>
                <div className="flex items-center gap-2">
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, true) }} />
                  <Button onClick={() => thumbRef.current?.click()} isLoading={uploading} variant="secondary">Upload Thumbnail</Button>
                  {newMedia.thumbnail_url ? (
                    <div className="flex items-center gap-2">
                      <img src={String(newMedia.thumbnail_url)} className="w-24 h-16 object-contain" />
                      <Button variant="danger" size="small" onClick={() => setNewMedia((p) => ({ ...p, thumbnail_url: undefined }))}><Trash /></Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Optional poster image for videos</div>
                  )}
                </div>
              </div>

              {newMedia.url && (
                <div className="mt-3">
                  <a href={String(newMedia.url)} target="_blank" rel="noreferrer">{String(newMedia.url)}</a>
                </div>
              )}
            </div>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button variant="secondary">Cancel</Button></Drawer.Close>
          <Button isLoading={submitting} onClick={handleCreate}>Create</Button>
        </Drawer.Footer>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: 'Media', icon: Photo })
export default MediaPage
