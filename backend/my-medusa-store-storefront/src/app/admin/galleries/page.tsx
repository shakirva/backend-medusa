"use client"

import { useState, useEffect } from "react"
import admin from "@lib/admin"

export default function GalleriesAdmin() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [mediaId, setMediaId] = useState("")
  const [galleryId, setGalleryId] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [notice, setNotice] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const json = await admin.listGalleries()
      setItems(json.galleries || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function onCreate(e: any) {
    e.preventDefault()
    setError("")
    setNotice("")
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required")
      return
    }
    try {
      await admin.createGallery({ name, slug })
      setName("")
      setSlug("")
      setNotice("Gallery created successfully")
      await fetchList()
    } catch (err) {
      console.error(err)
      setError("Failed to create gallery")
    }
  }

  async function onAddMedia(e: any) {
    e.preventDefault()
    if (!galleryId || !mediaId) return
    setError("")
    setNotice("")
    try {
      await admin.addMediaToGallery(galleryId, { media_id: mediaId })
      setNotice("Media added to gallery")
      setMediaId("")
    } catch (err) {
      console.error(err)
      setError("Failed to add media")
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Galleries</h2>
  {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
  {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <form onSubmit={onCreate} className="space-y-3 mb-6">
        <div>
          <label className="block text-sm">Name</label>
          <input className="w-full border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Slug</label>
          <input className="w-full border px-2 py-1" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <button className="px-4 py-2 bg-black text-white">Create Gallery</button>
      </form>

      <h3 className="text-lg font-medium mb-2">Add media to gallery</h3>
      <form onSubmit={onAddMedia} className="flex gap-2 mb-6">
        <input placeholder="gallery id" className="border px-2 py-1" value={galleryId} onChange={(e)=>setGalleryId(e.target.value)} />
        <input placeholder="media id" className="border px-2 py-1" value={mediaId} onChange={(e)=>setMediaId(e.target.value)} />
        <button className="px-3 py-1 bg-black text-white">Add</button>
      </form>

      <h3 className="text-lg font-medium mb-2">Existing Galleries</h3>
      <ul className="space-y-2">
        {items.map((g) => (
          <li key={g.id} className="border p-2 grid grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-xs">Name</label>
              <input className="w-full border px-2 py-1" defaultValue={g.name} onBlur={(e)=>admin.updateGallery(g.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs">Slug</label>
              <input className="w-full border px-2 py-1" defaultValue={g.slug} onBlur={(e)=>admin.updateGallery(g.id, { slug: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs">Display Order</label>
              <input className="w-full border px-2 py-1" type="number" defaultValue={g.display_order ?? 0} onBlur={(e)=>admin.updateGallery(g.id, { display_order: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <input id={`gactive-${g.id}`} type="checkbox" defaultChecked={!!g.is_active} onChange={(e)=>admin.updateGallery(g.id, { is_active: e.target.checked })} />
              <label htmlFor={`gactive-${g.id}`} className="text-xs">Active</label>
            </div>
            <div className="flex justify-end">
              <button className="px-3 py-1 bg-red-600 text-white" onClick={async ()=>{ await admin.deleteGallery(g.id); await fetchList(); }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
