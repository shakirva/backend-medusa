"use client"

import { useState } from "react"
import { MEDUSA_BACKEND_URL } from "@lib/config"
import Link from "next/link"

export default function SellerRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [storeName, setStoreName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setNotice("")
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${MEDUSA_BACKEND_URL}/store/seller-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, store_name: storeName, message }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt)
      }
      setNotice("Request submitted. We'll contact you soon.")
      setName("")
      setEmail("")
      setPhone("")
      setStoreName("")
      setMessage("")
    } catch (err: any) {
      console.error(err)
      setError("Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-4">
        <Link className="text-blue-600 hover:underline" href="/sellers">← Sellers</Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Register as a Seller</h1>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
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
          <label className="block text-sm">Message</label>
          <textarea className="w-full border px-2 py-1" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} />
        </div>
        <button disabled={loading} className="px-4 py-2 bg-black text-white">
          {loading ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  )
}
