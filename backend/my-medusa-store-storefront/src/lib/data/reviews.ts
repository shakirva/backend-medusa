import { MEDUSA_BACKEND_URL } from "@lib/config"

export type StoreReview = {
  id: string
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  content?: string | null
  status: string
  created_at?: string
}

export async function listProductReviews(productId: string) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products/${productId}/reviews`, {
    cache: "no-store",
    headers: {
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch reviews (${res.status})`)
  return (await res.json()) as { reviews: StoreReview[] }
}
