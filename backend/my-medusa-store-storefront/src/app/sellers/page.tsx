import Link from "next/link"
import { MEDUSA_BACKEND_URL } from "@lib/config"

async function getSellers() {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/sellers`, { cache: "no-store" })
    if (!res.ok) return []
    const json = await res.json()
    return json.sellers || json.items || []
  } catch {
    return []
  }
}

export default async function SellersDirectory() {
  const sellers = await getSellers()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sellers</h1>
      {sellers.length === 0 ? (
        <div className="text-sm text-gray-600">No sellers found.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sellers.map((s: any) => (
            <li key={s.id} className="border p-4 rounded">
              <div className="font-medium">{s.store_name || s.name}</div>
              <div className="text-sm text-gray-600">{s.email}</div>
              <div className="mt-2">
                <Link className="text-blue-600 hover:underline" href={`/sellers/${s.id}`}>View profile</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
