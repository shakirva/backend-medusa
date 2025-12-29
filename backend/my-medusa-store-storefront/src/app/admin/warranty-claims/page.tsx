"use client"

import { useEffect, useState } from "react"
import admin from "@lib/admin"

type Claim = {
  id: string
  warranty_id: string
  customer_email: string
  issue_description: string
  status?: string
  admin_notes?: string | null
}

export default function WarrantyClaimsAdmin() {
  const [items, setItems] = useState<Claim[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    setError("")
    try {
      const q = statusFilter ? { status: statusFilter } : undefined
      const json = await admin.listWarrantyClaims(q as any)
      setItems(json.claims || json.items || [])
    } catch (e) {
      console.error(e)
      setError("Failed to load claims")
    }
  }

  async function onFieldUpdate(id: string, patch: any) {
    setError("")
    setNotice("")
    try {
      await admin.updateWarrantyClaim(id, patch)
      setNotice("Updated")
      await fetchList()
    } catch (e) {
      console.error(e)
      setError("Update failed")
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Warranty Claims</h2>
      <div className="flex gap-2 mb-4 items-center">
        <label className="text-sm">Status</label>
        <select className="border px-2 py-1" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="submitted">submitted</option>
          <option value="in_review">in_review</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="completed">completed</option>
        </select>
        <button className="px-3 py-1 border" onClick={fetchList}>Filter</button>
      </div>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 text-xs">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Warranty</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Issue</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Admin notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 border font-mono text-[11px]">{c.id}</td>
                <td className="p-2 border font-mono text-[11px]">{c.warranty_id}</td>
                <td className="p-2 border">{c.customer_email}</td>
                <td className="p-2 border max-w-xs">{c.issue_description}</td>
                <td className="p-2 border">
                  <select defaultValue={c.status || "submitted"} className="border px-2 py-1" onChange={(e)=>onFieldUpdate(c.id, { status: e.target.value })}>
                    <option value="submitted">submitted</option>
                    <option value="in_review">in_review</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                    <option value="completed">completed</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <input className="border px-2 py-1 w-56" defaultValue={c.admin_notes || ""} onBlur={(e)=>onFieldUpdate(c.id, { admin_notes: e.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
