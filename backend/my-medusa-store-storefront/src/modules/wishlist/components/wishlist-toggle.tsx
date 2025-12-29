"use client"

import { useEffect, useState } from "react"
import { MEDUSA_BACKEND_URL } from "@lib/config"

// Auth-enabled: rely on session (cookie/token). Fallback removed.

interface Props {
  productId: string
  className?: string
}

export default function WishlistToggle({ productId, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [itemId, setItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initial fetch to see if product already in wishlist
  useEffect(() => {
    let ignore = false
    async function check() {
      try {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist`, {
          credentials: "include",
          headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
        })
        if (!res.ok) return
        const data = await res.json()
        if (ignore) return
        const match = (data.items || []).find((i: any) => i.product_id === productId)
        if (match) {
          setInWishlist(true)
          setItemId(match.id)
        }
      } catch (e:any) {
        // silently ignore
      }
    }
    check()
    return () => { ignore = true }
  }, [productId])

  async function toggle() {
    setError(null)
    setLoading(true)
    try {
      if (!inWishlist) {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist/items`, {
          method: "POST",
          credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
            body: JSON.stringify({ product_id: productId })
        })
        if (!res.ok) throw new Error(`Add failed ${res.status}`)
        const data = await res.json()
        setItemId(data.item.id)
        setInWishlist(true)
      } else if (itemId) {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist/items/${itemId}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
        })
        if (!res.ok) throw new Error(`Remove failed ${res.status}`)
        setInWishlist(false)
        setItemId(null)
      }
    } catch (e:any) {
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className={`text-sm transition flex items-center gap-1 ${className || ""}`}
    >
      <span className={inWishlist ? "text-pink-600" : "text-gray-400"}>
        {inWishlist ? "♥" : "♡"}
      </span>
      <span className="text-[11px] text-gray-500">
        {loading ? "..." : inWishlist ? "Saved" : "Save"}
      </span>
      {error && <span className="text-red-500 text-[10px] ml-2">{error}</span>}
    </button>
  )
}
