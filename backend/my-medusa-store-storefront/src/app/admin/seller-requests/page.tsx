"use client"

import { useEffect, useState } from "react"
import admin from "@lib/admin"

 type SellerRequest = {
  id: string
  name?: string
  email?: string
  phone?: string
  store_name?: string
  message?: string
  status?: string
  created_at?: string
}

export default function SellerRequestsAdmin() {
  const [items, setItems] = useState<SellerRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function fetchList() {
    setLoading(true)
    setError("")
    try {
      const json = await admin.listSellerRequests(statusFilter)
      setItems(json.seller_requests || json.items || [])
    } catch (e) {
      console.error(e)
      setError("Failed to load seller requests")
    } finally {
      setLoading(false)
    }
  }

  async function onChangeStatus(id: string, next: string) {
    setError("")
    setNotice("")
    try {
      await admin.updateSellerRequest(id, { status: next })
      setNotice(`Request ${next}`)
      await fetchList()
    } catch (e) {
      console.error(e)
      setError(`Failed to ${next} request`)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Seller Requests</h2>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm">Filter status</label>
        <select className="border px-2 py-1" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="all">all</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-gray-600">No requests</div>
          )}
          {items.map((r) => (
            <div key={r.id} className="border p-3 rounded">
              <div className="flex justify-between items-start gap-4">
                <div className="text-sm">
                  <div className="font-medium">{r.store_name || r.name || "(no name)"}</div>
                  <div className="text-gray-600">{r.email} {r.phone ? `· ${r.phone}` : ""}</div>
                  <div className="text-xs text-gray-500">#{r.id} · {r.status} · {r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
                  {r.message && <div className="mt-2 text-gray-700">{r.message}</div>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                    onClick={() => onChangeStatus(r.id, "approved")}
                    disabled={r.status === "approved"}
                  >Approve</button>
                  <button
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                    onClick={() => onChangeStatus(r.id, "rejected")}
                    disabled={r.status === "rejected"}
                  >Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
