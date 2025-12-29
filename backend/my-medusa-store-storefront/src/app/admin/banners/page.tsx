"use client"

import { useEffect, useState } from "react"
import admin from "@lib/admin"

type Banner = {
  id: string
  title?: string
  media_id?: string
  link?: string
  position?: string
  is_active?: boolean
  start_at?: string
  end_at?: string
  display_order?: number
}

export default function BannersAdmin() {
  const [items, setItems] = useState<Banner[]>([])
  const [title, setTitle] = useState("")
  const [mediaId, setMediaId] = useState("")
  const [link, setLink] = useState("")
  const [position, setPosition] = useState("home")
  const [isActive, setIsActive] = useState(true)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [order, setOrder] = useState<number>(0)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const json = await admin.listBanners()
      setItems(json.banners || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function onCreate(e: any) {
    e.preventDefault()
    setError("")
    setNotice("")
    if (!mediaId.trim()) {
      setError("media_id is required")
      return
    }
    try {
      await admin.createBanner({
        title,
        media_id: mediaId,
        link,
        position,
        is_active: isActive,
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        display_order: order || undefined,
      })
      setTitle("")
      setMediaId("")
      setLink("")
      setPosition("home")
      setIsActive(true)
      setStartAt("")
      setEndAt("")
      setOrder(0)
      setNotice("Banner created")
      await fetchList()
    } catch (err) {
      console.error(err)
      setError("Failed to create banner")
    }
  }

  async function onDelete(id: string) {
    setError("")
    setNotice("")
    try {
      await admin.deleteBanner(id)
      setNotice("Banner deleted")
      await fetchList()
    } catch (err) {
      console.error(err)
      setError("Failed to delete banner")
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Banners</h2>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <form onSubmit={onCreate} className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-sm">media_id</label>
          <input className="w-full border px-2 py-1" value={mediaId} onChange={(e) => setMediaId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Title</label>
          <input className="w-full border px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Link (optional)</label>
          <input className="w-full border px-2 py-1" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Position</label>
          <input className="w-full border px-2 py-1" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="is_active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="is_active" className="text-sm">Active</label>
        </div>
        <div>
          <label className="block text-sm">Display Order</label>
          <input className="w-full border px-2 py-1" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm">Start at (ISO string)</label>
          <input className="w-full border px-2 py-1" placeholder="2025-11-27T00:00:00Z" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">End at (ISO string)</label>
          <input className="w-full border px-2 py-1" placeholder="2025-12-31T23:59:59Z" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
        <div className="col-span-2">
          <button className="px-4 py-2 bg-black text-white">Create Banner</button>
        </div>
      </form>

      <h3 className="text-lg font-medium mb-2">Existing Banners</h3>
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.id} className="border p-3">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div>
                <label className="block text-xs">Title</label>
                <input className="w-full border px-2 py-1" defaultValue={b.title} onBlur={(e)=>admin.updateBanner(b.id, { title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs">Position</label>
                <input className="w-full border px-2 py-1" defaultValue={b.position} onBlur={(e)=>admin.updateBanner(b.id, { position: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs">Display Order</label>
                <input className="w-full border px-2 py-1" type="number" defaultValue={b.display_order ?? 0} onBlur={(e)=>admin.updateBanner(b.id, { display_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <input id={`active-${b.id}`} type="checkbox" defaultChecked={!!b.is_active} onChange={(e)=>admin.updateBanner(b.id, { is_active: e.target.checked })} />
                <label htmlFor={`active-${b.id}`} className="text-xs">Active</label>
              </div>
              <div className="flex justify-end">
                <button className="px-3 py-1 bg-red-600 text-white" onClick={() => onDelete(b.id)}>Delete</button>
              </div>
              <div>
                <label className="block text-xs">Start at</label>
                <input className="w-full border px-2 py-1" defaultValue={b.start_at || ""} onBlur={(e)=>admin.updateBanner(b.id, { start_at: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-xs">End at</label>
                <input className="w-full border px-2 py-1" defaultValue={b.end_at || ""} onBlur={(e)=>admin.updateBanner(b.id, { end_at: e.target.value || null })} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
