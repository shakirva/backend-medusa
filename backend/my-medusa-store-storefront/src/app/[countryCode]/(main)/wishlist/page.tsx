"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MEDUSA_BACKEND_URL } from "@lib/config"

export default function WishlistPage({ params }: { params: { countryCode: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [itemsCount, setItemsCount] = useState(0)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist`, {
          credentials: "include",
          headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
        })
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please sign in to view your wishlist.")
          } else {
            setError(`Failed to load (${res.status})`)
          }
          setLoading(false)
          return
        }
        const data = await res.json()
        if (ignore) return
        setProducts(data.products || [])
        setItemsCount((data.items || []).length)
      } catch (e:any) {
        if (!ignore) setError(e.message || "Error loading wishlist")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Wishlist</h1>
      {loading && <div className="text-sm text-neutral-600">Loading…</div>}
      {error && (
        <div className="text-sm text-red-600 mb-4">
          {error} {error.includes("sign in") && (
            <Link href={`/${params.countryCode}/account/login`} className="underline">Sign in</Link>
          )}
        </div>
      )}
      {!loading && !error && (
        <>
          <p className="text-sm text-neutral-600 mb-6">You have {itemsCount} item{itemsCount !== 1 && 's'} saved.</p>
          {products.length === 0 ? (
            <div className="text-neutral-500">No items yet. Browse <Link href={`/${params.countryCode}`}>products</Link> and click the heart icon to save.</div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any) => (
                <div key={p.id} className="border rounded-md p-4 flex flex-col gap-2 hover:shadow-sm transition">
                  <div className="font-medium line-clamp-1">{p.title}</div>
                  <div className="text-xs text-neutral-500">ID: {p.id}</div>
                  <Link href={`/${params.countryCode}/products/${p.handle || p.id}`} className="text-blue-600 text-sm hover:underline">View product</Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
