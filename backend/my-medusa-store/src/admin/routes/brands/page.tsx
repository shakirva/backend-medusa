import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import { Container, Heading, Button, Input, createDataTableColumnHelper, DataTable, DataTablePaginationState, useDataTable, Drawer } from "@medusajs/ui"
import { useRef } from "react"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Brand = {
  id: string
  name: string
  slug?: string | null
  logo?: string | null
  logo_url?: string | null
  is_active?: boolean
}

type BrandsResponse = { brands: Brand[]; count: number }

const columnHelper = createDataTableColumnHelper<Brand>()

const BrandsPage = () => {
  const limit = 20
  const [pagination, setPagination] = useState<DataTablePaginationState>({ pageSize: limit, pageIndex: 0 })
  const offset = useMemo(() => pagination.pageIndex * limit, [pagination])

  const { data, isLoading, refetch } = useQuery<BrandsResponse>({
    queryFn: () => sdk.client.fetch('/admin/brands', { query: { limit, offset } }),
    queryKey: [['admin-brands', limit, offset]],
  })

  const [openCreate, setOpenCreate] = useState(false)
  const [newBrand, setNewBrand] = useState<Partial<Brand>>({ is_active: true })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [editBrand, setEditBrand] = useState<Partial<Brand> | null>(null)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [uploadingEdit, setUploadingEdit] = useState(false)
  const fileEditRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('http://localhost:9000/uploads', { method: 'POST', body: form, credentials: 'include' })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setNewBrand((p) => ({ ...p, logo: data.url }))
    } catch (e) {
      console.error('Logo upload failed', e)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadEdit = async (file: File) => {
    setUploadingEdit(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('http://localhost:9000/uploads', { method: 'POST', body: form, credentials: 'include' })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setEditBrand((p) => p ? ({ ...p, logo: data.url }) : p)
    } catch (e) {
      console.error('Logo upload failed', e)
    } finally {
      setUploadingEdit(false)
    }
  }

  const handleCreate = async () => {
    if (!newBrand.name) return
    setSubmitting(true)
    try {
      await sdk.client.fetch('/admin/brands', { method: 'POST', body: newBrand })
      setOpenCreate(false)
      setNewBrand({ is_active: true })
      await refetch()
    } catch (e) {
      console.error('Create brand failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editBrand?.id) return
    setSubmittingEdit(true)
    try {
      const id = editBrand.id
      // send the editable fields
      const payload: Partial<Brand> = {
        name: editBrand.name,
        slug: editBrand.slug,
        logo: editBrand.logo,
      }
      await sdk.client.fetch(`/admin/brands/${id}`, { method: 'PUT', body: payload })
      setOpenEdit(false)
      setEditBrand(null)
      await refetch()
    } catch (e) {
      console.error('Update brand failed', e)
    } finally {
      setSubmittingEdit(false)
    }
  }

  const columns = [
    columnHelper.accessor('id', { header: 'ID', cell: ({ getValue }) => getValue().substring(0, 8) + '...' }),
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.display({ id: 'logo', header: 'Logo', cell: ({ row }) => (
      row.original.logo ? <img src={row.original.logo} className="w-16 h-10 object-contain rounded"/> : <div className="w-16 h-10 bg-gray-100 rounded"/>
    ) }),
    columnHelper.display({ id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="small" variant="secondary" onClick={async () => {
          // open edit drawer
          setEditBrand(row.original)
          setOpenEdit(true)
        }}>Edit</Button>
        <Button size="small" variant="danger" onClick={async () => { if (confirm('Delete this brand?')) { await sdk.client.fetch(`/admin/brands/${row.original.id}`, { method: 'DELETE' }); await refetch() } }}>Delete</Button>
      </div>
    )}),
  ]

  const table = useDataTable({ columns, data: data?.brands || [], getRowId: (r) => r.id, rowCount: data?.count || 0, isLoading, pagination: { state: pagination, onPaginationChange: setPagination } })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between">
          <Heading>Brands</Heading>
          <Button variant="primary" onClick={() => setOpenCreate(true)}>Create Brand</Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <Drawer open={openCreate} onOpenChange={setOpenCreate}>
        <Drawer.Header>
          <Drawer.Title>Create Brand</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            <Input placeholder="Name" value={newBrand.name || ''} onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Slug (optional)" value={newBrand.slug || ''} onChange={(e) => setNewBrand((p) => ({ ...p, slug: e.target.value }))} />
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
              <Button onClick={() => fileRef.current?.click()} isLoading={uploading} variant="secondary">Upload Logo</Button>
              {newBrand.logo && <img src={newBrand.logo} className="w-full h-28 object-contain mt-3" />}
            </div>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button variant="secondary">Cancel</Button></Drawer.Close>
          <Button isLoading={submitting} onClick={handleCreate}>Create</Button>
        </Drawer.Footer>
      </Drawer>

      {/* Edit Brand Drawer */}
      <Drawer open={openEdit} onOpenChange={(v) => { if (!v) setEditBrand(null); setOpenEdit(v) }}>
        <Drawer.Header>
          <Drawer.Title>Edit Brand</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {editBrand ? (
            <div className="flex flex-col gap-4">
              <Input placeholder="Name" value={editBrand.name || ''} onChange={(e) => setEditBrand((p) => p ? ({ ...p, name: e.target.value }) : p)} />
              <Input placeholder="Slug (optional)" value={editBrand.slug || ''} onChange={(e) => setEditBrand((p) => p ? ({ ...p, slug: e.target.value }) : p)} />
              <div>
                <input ref={fileEditRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadEdit(f) }} />
                <Button onClick={() => fileEditRef.current?.click()} isLoading={uploadingEdit} variant="secondary">Upload Logo</Button>
                {editBrand.logo && <img src={String(editBrand.logo)} className="w-full h-28 object-contain mt-3" />}
                {editBrand.logo_url && !editBrand.logo && <img src={String(editBrand.logo_url)} className="w-full h-28 object-contain mt-3" />}
              </div>
            </div>
          ) : null}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button variant="secondary">Cancel</Button></Drawer.Close>
          <Button isLoading={submittingEdit} onClick={handleUpdate}>Save</Button>
        </Drawer.Footer>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: 'Brands', icon: TagSolid })
export default BrandsPage
