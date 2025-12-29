"use client"

import { useState } from "react"
import { MEDUSA_BACKEND_URL } from "@lib/config"
import { useRouter } from "next/navigation"

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("customer@marqasouq.com")
  const [password, setPassword] = useState("customer123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${MEDUSA_BACKEND_URL}/store/auth/emailpass`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Login failed (${res.status}) ${txt}`)
      }
      // Successful login sets cookie on backend domain. Now navigate.
      router.push(redirectTo || "/wishlist")
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm w-full space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
