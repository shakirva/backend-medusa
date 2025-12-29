"use client"

import { useEffect, useState } from "react"
import admin from "@lib/admin"

type Warranty = {
  id: string
  product_id: string
  customer_email: string
  type?: string
  duration_months?: number
  start_date?: string
  end_date?: string
  status?: string
  terms?: string | null
}

export default function WarrantiesAdmin() {
  const [items, setItems] = useState<Warranty[]>([])
  const [emailFilter, setEmailFilter] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    setError("")
    try {
      const q = emailFilter.trim() ? { email: emailFilter.trim() } : undefined
      const json = await admin.listWarranties(q as any)
      setItems(json.warranties || json.items || [])
    } catch (e) {
      console.error(e)
      setError("Failed to load warranties")
    }
  }

  async function onFieldUpdate(id: string, patch: any) {
    setError("")
    setNotice("")
    try {
      await admin.updateWarranty(id, patch)
      setNotice("Updated")
      await fetchList()
    } catch (e) {
      console.error(e)
      setError("Update failed")
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Warranties</h2>
      <div className="flex gap-2 mb-4">
        <input className="border px-2 py-1" placeholder="Filter by email" value={emailFilter} onChange={(e)=>setEmailFilter(e.target.value)} />
        <button className="px-3 py-1 border" onClick={fetchList}>Search</button>
      </div>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Duration</th>
              <th className="p-2 border">Start</th>
              <th className="p-2 border">End</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Terms</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-2 border font-mono text-[11px]">{w.id}</td>
                <td className="p-2 border font-mono text-[11px]">{w.product_id}</td>
                <td className="p-2 border">{w.customer_email}</td>
                <td className="p-2 border">{w.type}</td>
                <td className="p-2 border">{w.duration_months}</td>
                <td className="p-2 border">{w.start_date ? new Date(w.start_date).toLocaleDateString() : ""}</td>
                <td className="p-2 border">
                  <input
                    type="date"
                    className="border px-2 py-1"
                    defaultValue={w.end_date ? new Date(w.end_date).toISOString().slice(0,10) : ""}
                    onBlur={(e)=>onFieldUpdate(w.id, { end_date: e.target.value })}
                  />
                </td>
                <td className="p-2 border">
                  <select defaultValue={w.status || "active"} className="border px-2 py-1" onChange={(e)=>onFieldUpdate(w.id, { status: e.target.value })}>
                    <option value="active">active</option>
                    <option value="expired">expired</option>
                    <option value="void">void</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <input className="border px-2 py-1 w-56" defaultValue={w.terms || ""} onBlur={(e)=>onFieldUpdate(w.id, { terms: e.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
