"use client"

import { useState, useEffect } from "react"
import admin from "@lib/admin"

export default function BrandsAdmin() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [logo_url, setLogo] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const json = await admin.listBrands()
      setItems(json.brands || [])
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
    setLoading(true)
    try {
      await admin.createBrand({ name, slug, logo_url })
      setName("")
      setSlug("")
      setLogo("")
      setNotice("Brand created successfully")
      await fetchList()
    } catch (err) {
      console.error(err)
      setError("Failed to create brand")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Brands</h2>
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
        <div>
          <label className="block text-sm">Logo URL</label>
          <input className="w-full border px-2 py-1" value={logo_url} onChange={(e) => setLogo(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-black text-white" disabled={loading}>{loading ? 'Creating...' : 'Create Brand'}</button>
      </form>

      <h3 className="text-lg font-medium mb-2">Existing Brands</h3>
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.id} className="border p-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-sm text-gray-600">slug: {b.slug}</div>
            </div>
            <div className="text-sm">Products: {b.product_count ?? 0}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
