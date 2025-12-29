"use client"

import { useEffect, useState } from "react"
import admin from "@lib/admin"

type Seller = {
  id: string
  name?: string
  email?: string
  phone?: string
  store_name?: string
  status?: string
}

export default function SellersAdmin() {
  const [items, setItems] = useState<Seller[]>([])
  const [selectedSellerId, setSelectedSellerId] = useState<string>("")
  const [linkedProducts, setLinkedProducts] = useState<Record<string, any[]>>({})
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [storeName, setStoreName] = useState("")
  const [status, setStatus] = useState("active")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const json = await admin.listSellers()
      setItems(json.sellers || json.items || [])
      // Optionally fetch linked products for each seller
      const sellers = json.sellers || json.items || []
      const map: Record<string, any[]> = {}
      for (const s of sellers) {
        try {
          const detail = await admin.getSeller(s.id)
          map[s.id] = detail.product_links || []
        } catch {}
      }
      setLinkedProducts(map)
    } catch (e) {
      console.error(e)
    }
  }

  async function onCreate(e: any) {
    e.preventDefault()
    setError("")
    setNotice("")
    if (!name.trim() || !email.trim()) {
      setError("name and email are required")
      return
    }
    try {
      await admin.createSeller({ name, email, phone, store_name: storeName, status })
      setName("")
      setEmail("")
      setPhone("")
      setStoreName("")
      setStatus("active")
      setNotice("Seller created")
      await fetchList()
    } catch (err) {
      console.error(err)
      setError("Failed to create seller")
    }
  }

  async function onFieldUpdate(id: string, field: string, value: any) {
    try {
      await admin.updateSeller(id, { [field]: value })
    } catch (e) {
      console.error(e)
      setError("Failed to update seller")
    }
  }

  async function onLinkProduct(id: string, productId: string) {
    setError("")
    setNotice("")
    if (!productId.trim()) return
    try {
      await admin.linkSellerProduct(id, { product_id: productId })
      setNotice("Product linked to seller")
      await fetchList()
    } catch (e) {
      console.error(e)
      setError("Failed to link product")
    }
  }

  async function onUnlinkProduct(id: string, productId: string) {
    setError("")
    setNotice("")
    try {
      await admin.unlinkSellerProduct(id, productId)
      setNotice("Product unlinked")
      await fetchList()
    } catch (e) {
      console.error(e)
      setError("Failed to unlink product")
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Sellers</h2>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <form onSubmit={onCreate} className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-sm">Name</label>
          <input className="w-full border px-2 py-1" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border px-2 py-1" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Phone</label>
          <input className="w-full border px-2 py-1" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Store name</label>
          <input className="w-full border px-2 py-1" value={storeName} onChange={(e)=>setStoreName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select className="w-full border px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div className="col-span-2">
          <button className="px-4 py-2 bg-black text-white">Create Seller</button>
        </div>
      </form>

      <h3 className="text-lg font-medium mb-2">Existing Sellers</h3>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="border p-3 rounded">
            <div className="grid grid-cols-6 gap-2 items-end">
              <div>
                <label className="block text-xs">Name</label>
                <input className="w-full border px-2 py-1" defaultValue={s.name} onBlur={(e)=>onFieldUpdate(s.id, "name", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs">Email</label>
                <input className="w-full border px-2 py-1" defaultValue={s.email} onBlur={(e)=>onFieldUpdate(s.id, "email", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs">Phone</label>
                <input className="w-full border px-2 py-1" defaultValue={s.phone} onBlur={(e)=>onFieldUpdate(s.id, "phone", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs">Store name</label>
                <input className="w-full border px-2 py-1" defaultValue={s.store_name} onBlur={(e)=>onFieldUpdate(s.id, "store_name", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs">Status</label>
                <select className="w-full border px-2 py-1" defaultValue={s.status || "active"} onChange={(e)=>onFieldUpdate(s.id, "status", e.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs">Link product (ID)</label>
                <div className="flex gap-2">
                  <input className="w-full border px-2 py-1" placeholder="prod_..." id={`prod-${s.id}`} />
                  <button type="button" className="px-3 py-1 border rounded" onClick={() => {
                    const input = document.getElementById(`prod-${s.id}`) as HTMLInputElement | null
                    onLinkProduct(s.id, input?.value || "")
                  }}>Link</button>
                </div>
              </div>
            </div>
            {linkedProducts[s.id]?.length ? (
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Linked products</div>
                <ul className="flex flex-wrap gap-2">
                  {linkedProducts[s.id].map((pl: any) => (
                    <li key={pl.id} className="text-xs border px-2 py-1 rounded flex items-center gap-2">
                      <span className="font-mono">{pl.product_id}</span>
                      <button type="button" className="border rounded px-2 py-0.5" onClick={() => onUnlinkProduct(s.id, pl.product_id)}>Unlink</button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
