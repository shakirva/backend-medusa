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
  const [autoCreate, setAutoCreate] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const thumbRef = useRef<HTMLInputElement | null>(null)
  // Keep a ref mirror of newMedia so async handlers always read fresh values
  const newMediaRef = useRef<Partial<Media>>({})
  const autoCreateRef = useRef(true)
  // Dedicated ref for the main uploaded URL — never overwritten by thumbnail uploads
  const uploadedFileUrlRef = useRef<string>('')

  // Keep refs in sync
  const updateNewMedia = (updater: (prev: Partial<Media>) => Partial<Media>) => {
    setNewMedia((prev) => {
      const next = updater(prev)
      newMediaRef.current = next
      return next
    })
  }

  // Capture a thumbnail frame from a video file (client-side, at 1 second)
  const captureVideoThumbnail = (file: File): Promise<File | null> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video')
        const url = URL.createObjectURL(file)
        video.src = url
        video.muted = true
        video.playsInline = true
        video.currentTime = 1
        const cleanup = () => URL.revokeObjectURL(url)
        video.onloadeddata = () => {
          video.currentTime = 1
        }
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 360
            const ctx = canvas.getContext('2d')
            if (!ctx) { cleanup(); return resolve(null) }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              cleanup()
              if (!blob) return resolve(null)
              const thumbFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
              resolve(thumbFile)
            }, 'image/jpeg', 0.85)
          } catch { cleanup(); resolve(null) }
        }
        video.onerror = () => { cleanup(); resolve(null) }
        // Fallback timeout
        setTimeout(() => { cleanup(); resolve(null) }, 8000)
      } catch { resolve(null) }
    })
  }

  // Upload a file to the server, returns the URL or null on failure
  const uploadFile = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const form = new FormData()
      form.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/admin/media/upload`)
      xhr.withCredentials = true
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)?.url || null) } catch { resolve(null) }
        } else { resolve(null) }
      }
      xhr.onerror = () => resolve(null)
      xhr.send(form)
    })
  }

  const saveMediaRecord = async (uploadedUrl: string, mimeType: string, fileName: string) => {
    const snap = newMediaRef.current
    const payload: any = {
      url: uploadedUrl,
      title: snap.title || fileName,
      title_ar: snap.title_ar || null,
      mime_type: mimeType,
      brand: snap.brand || 'Markasouq',
      views: snap.views || 0,
      display_order: snap.display_order || 0,
      is_featured: snap.is_featured || false,
      product_ids: snap.product_ids || [],
    }
    if (snap.thumbnail_url) payload.thumbnail_url = snap.thumbnail_url

    // Use native fetch with credentials — sdk.client.fetch may not serialize body correctly
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
  }

  const handleUpload = async (file: File, isThumbnail = false) => {
    setUploading(true)
    setProgress(0)
    setMessage(null)
    setCreateError(null)
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
              if (isThumbnail) {
                updateNewMedia((p) => ({ ...p, thumbnail_url: resp.url }))
              } else {
                // Update both state/ref AND a stable local variable for the autoCreate path
                uploadedUrl = resp.url || ''
                uploadedFileUrlRef.current = uploadedUrl  // dedicated ref — never wiped by thumbnail uploads
                updateNewMedia((p) => ({ ...p, url: uploadedUrl, mime_type: file.type }))
                // Also set directly on ref right now (before any async batching)
                newMediaRef.current = { ...newMediaRef.current, url: uploadedUrl, mime_type: file.type }
              }
              setMessage('Upload succeeded')
              resolve()
            } catch {
              reject(new Error('Invalid upload response'))
            }
          } else {
            reject(new Error(`Upload failed ${xhr.status}: ${xhr.responseText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(form)
      })

      // Auto-create record right after upload using the ref (always fresh)
      if (!isThumbnail && autoCreateRef.current && uploadedUrl) {
        setSubmitting(true)

        // Auto-capture thumbnail from video before saving
        let autoThumbUrl: string | null = newMediaRef.current.thumbnail_url || null
        if (!autoThumbUrl && file.type.startsWith('video/')) {
          setMessage('Generating thumbnail…')
          try {
            const thumbFile = await captureVideoThumbnail(file)
            if (thumbFile) {
              setMessage('Uploading thumbnail…')
              const tUrl = await uploadFile(thumbFile)
              if (tUrl) {
                autoThumbUrl = tUrl
                updateNewMedia((p) => ({ ...p, thumbnail_url: tUrl }))
              }
            }
          } catch { /* thumbnail is optional, continue */ }
        }

        setMessage('Saving media record…')
        try {
          // Temporarily inject the thumbnail into the ref so saveMediaRecord picks it up
          if (autoThumbUrl) newMediaRef.current = { ...newMediaRef.current, thumbnail_url: autoThumbUrl }
          await saveMediaRecord(uploadedUrl, file.type, file.name)
          setMessage('✅ Media created successfully!')
          setOpenCreate(false)
          newMediaRef.current = {}
          setNewMedia({})
          uploadedFileUrlRef.current = ''
          await refetch()
        } catch (err: any) {
          setMessage(`❌ File uploaded but record save failed: ${err?.message || 'unknown error'}`)
        } finally {
          setSubmitting(false)
        }
      }
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Upload failed'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    // Use dedicated ref — never wiped by thumbnail uploads
    const url = uploadedFileUrlRef.current || newMediaRef.current.url
    if (!url) {
      setCreateError('Please upload a file first, then click Create.')
      return
    }
    setCreateError(null)
    setSubmitting(true)

    // Auto-capture thumbnail if not already set and URL is a video
    if (!newMediaRef.current.thumbnail_url && newMediaRef.current.mime_type?.startsWith('video/')) {
      setMessage('Generating thumbnail…')
      try {
        const resp = await fetch(newMediaRef.current.url || '')
        const blob = await resp.blob()
        const videoFile = new File([blob], 'video.mp4', { type: blob.type })
        const thumbFile = await captureVideoThumbnail(videoFile)
        if (thumbFile) {
          const tUrl = await uploadFile(thumbFile)
          if (tUrl) newMediaRef.current = { ...newMediaRef.current, thumbnail_url: tUrl }
        }
      } catch { /* optional */ }
    }

    try {
      await saveMediaRecord(url, newMediaRef.current.mime_type || '', 'Untitled')
      setOpenCreate(false)
      newMediaRef.current = {}
      setNewMedia({})
      uploadedFileUrlRef.current = ''
      setMessage(null)
      setCreateError(null)
      await refetch()
    } catch (e: any) {
      setCreateError(e?.message || 'Failed to save. Please try again.')
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
          <Button variant="primary" onClick={() => { setOpenCreate(true); newMediaRef.current = {}; setNewMedia({}); setMessage(null); setCreateError(null); }}>Create Media</Button>
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
            <Input placeholder="Title (English)" value={newMedia.title || ''} onChange={(e) => updateNewMedia((p) => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Title (Arabic)" value={newMedia.title_ar || ''} onChange={(e) => updateNewMedia((p) => ({ ...p, title_ar: e.target.value }))} dir="rtl" />

            {/* Brand Logo Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
              <BrandLogoPicker
                value={newMedia.brand || ''}
                onChange={(name) => updateNewMedia((p) => ({ ...p, brand: name }))}
              />
              <input
                type="text"
                placeholder="Or type brand name manually"
                value={newMedia.brand || ''}
                onChange={(e) => updateNewMedia((p) => ({ ...p, brand: e.target.value }))}
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-500 placeholder-gray-400"
              />
            </div>

            {/* Product Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Linked Products <span className="text-xs text-gray-400 font-normal">(shown on right side of video)</span>
              </label>
              <ProductPicker
                selectedIds={newMedia.product_ids || []}
                onChange={(ids) => updateNewMedia((p) => ({ ...p, product_ids: ids }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Display Order" type="number" value={newMedia.display_order || 0} onChange={(e) => updateNewMedia((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
              <Input placeholder="Initial Views" type="number" value={newMedia.views || 0} onChange={(e) => updateNewMedia((p) => ({ ...p, views: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-3">
              <input id="isFeatured" type="checkbox" checked={!!newMedia.is_featured} onChange={(e) => updateNewMedia((p) => ({ ...p, is_featured: e.target.checked }))} />
              <label htmlFor="isFeatured" className="text-sm">Featured Video (show prominently)</label>
            </div>
            <Input placeholder="Mime Type (auto-detected)" value={newMedia.mime_type || ''} onChange={(e) => updateNewMedia((p) => ({ ...p, mime_type: e.target.value }))} />
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
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">Uploading: {progress}%</span>
                </div>
              )}

              {message && (
                <div className={`text-sm mb-2 px-3 py-2 rounded ${message.includes('fail') || message.includes('error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {message}
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <input id="autoCreate" type="checkbox" checked={autoCreate} onChange={(e) => { setAutoCreate(e.target.checked); autoCreateRef.current = e.target.checked }} />
                <label htmlFor="autoCreate" className="text-sm">Automatically create media record after upload</label>
              </div>

              <div className="mb-3">
                <label className="text-sm block mb-1">Thumbnail (optional)</label>
                <div className="flex items-center gap-2">
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, true) }} />
                  <Button onClick={() => thumbRef.current?.click()} isLoading={uploading} variant="secondary">Upload Thumbnail</Button>
                  {newMedia.thumbnail_url ? (
                    <div className="flex items-center gap-2">
                      <img src={String(newMedia.thumbnail_url)} className="w-24 h-16 object-contain" />
                      <Button variant="danger" size="small" onClick={() => updateNewMedia((p) => ({ ...p, thumbnail_url: undefined }))}><Trash /></Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Optional poster image for videos</div>
                  )}
                </div>
              </div>

              {newMedia.url && (
                <div className="mt-3">
                  <a href={String(newMedia.url)} target="_blank" rel="noreferrer" className="text-xs text-violet-600 underline">{String(newMedia.url)}</a>
                </div>
              )}
            </div>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          {createError && (
            <div className="w-full mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {createError}
            </div>
          )}
          <div className="flex gap-2 w-full justify-end">
            <Drawer.Close asChild><Button variant="secondary" onClick={() => { newMediaRef.current = {}; setNewMedia({}); uploadedFileUrlRef.current = ''; setMessage(null); setCreateError(null); }}>Cancel</Button></Drawer.Close>
            <Button isLoading={submitting} onClick={handleCreate}>
              {(newMedia.url || uploadedFileUrlRef.current) ? 'Create' : 'Create (upload file first)'}
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: 'Media', icon: Photo })
export default MediaPage

