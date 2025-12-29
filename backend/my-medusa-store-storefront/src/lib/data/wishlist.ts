import { MEDUSA_BACKEND_URL } from "../config"

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!publishableKey) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing; wishlist fetches will fail.")
}

export async function listWishlist(customerId: string) {
  const url = `${MEDUSA_BACKEND_URL}/store/wishlist?customer_id=${encodeURIComponent(customerId)}`
  const res = await fetch(url, {
    headers: {
      "x-publishable-api-key": publishableKey || "",
    },
    next: { tags: ["wishlist"] },
  })
  if (!res.ok) throw new Error(`Failed to fetch wishlist (${res.status})`)
  return res.json() as Promise<{ customer_id: string; items: any[]; products: any[] }>
}

export async function addToWishlist(customerId: string, productId: string) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey || "",
    },
    body: JSON.stringify({ customer_id: customerId, product_id: productId }),
  })
  if (!res.ok) throw new Error(`Failed to add wishlist item (${res.status})`)
  return res.json() as Promise<{ item: any }>
}

export async function removeFromWishlist(itemId: string) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wishlist/items/${itemId}`, {
    method: "DELETE",
    headers: {
      "x-publishable-api-key": publishableKey || "",
    },
  })
  if (!res.ok) throw new Error(`Failed to remove wishlist item (${res.status})`)
  return res.json() as Promise<{ id: string; deleted: boolean }>
}
