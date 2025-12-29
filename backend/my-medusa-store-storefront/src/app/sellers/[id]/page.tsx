import { MEDUSA_BACKEND_URL } from "@lib/config"
import Link from "next/link"

async function getSeller(id: string) {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/sellers/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function SellerDetail({ params }: { params: { id: string } }) {
  const data = await getSeller(params.id)
  const seller = data?.seller
  const productLinks: any[] = data?.product_links || []

  if (!seller) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-sm text-gray-600">Seller not found.</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link className="text-blue-600 hover:underline" href="/sellers">← All sellers</Link>
      </div>
      <h1 className="text-2xl font-semibold">{seller.store_name || seller.name}</h1>
      <div className="text-sm text-gray-600">{seller.email} {seller.phone ? `· ${seller.phone}` : ""}</div>

      <h2 className="text-lg font-medium mt-6 mb-2">Products</h2>
      {productLinks.length === 0 ? (
        <div className="text-sm text-gray-600">No products linked yet.</div>
      ) : (
        <ul className="space-y-2">
          {productLinks.map((pl: any) => (
            <li key={pl.id} className="border p-3 rounded">
              <div className="text-sm">Product: <span className="font-mono">{pl.product_id}</span></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
