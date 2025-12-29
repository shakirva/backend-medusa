"use client"
import { useState } from "react"
import { MEDUSA_BACKEND_URL } from "@lib/config"

interface Props {
  productId: string
}

export default function ReviewForm({ productId }: Props) {
  const [rating, setRating] = useState<number>(5)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products/${productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({ rating, title, content }),
      })
      if (res.status === 401) {
        setError("Please sign in to submit a review.")
        return
      }
      if (!res.ok) {
        setError(`Failed (${res.status})`)
        return
      }
      setSuccess(true)
      setTitle("")
      setContent("")
    } catch (e:any) {
      setError(e.message || "Error submitting review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border rounded p-4">
      <h3 className="text-sm font-medium">Write a Review</h3>
      <div className="flex gap-2 items-center text-xs">
        <label>Rating:</label>
        <select value={rating} onChange={(e)=>setRating(Number(e.target.value))} className="border rounded px-2 py-1">
          {[5,4,3,2,1].map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-yellow-600">{"★".repeat(rating)}{"☆".repeat(5-rating)}</span>
      </div>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Your review (optional)"
        value={content}
        onChange={(e)=>setContent(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm min-h-[90px]"
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      {success && <div className="text-xs text-green-600">Submitted! Pending approval.</div>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
      {error?.includes("sign in") && (
        <div className="text-xs mt-2">
          <a href="/dk/account/login" className="underline">Sign in</a> to submit.
        </div>
      )}
    </form>
  )
}
