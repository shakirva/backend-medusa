import Image from "next/image"
import Link from "next/link"
import { listBrands } from "@lib/data/brands"

export const metadata = {
  title: "Brands",
}

export default async function BrandsPage() {
  const { brands } = await listBrands()

  return (
    <div className="px-6 py-10 md:px-8 lg:px-12">
      <h1 className="text-2xl font-semibold mb-6">Brands</h1>

      {brands.length === 0 ? (
        <p className="text-sm text-gray-500">No brands yet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brands.map((b) => (
            <li key={b.id} className="border rounded-md p-4 bg-white flex flex-col items-center justify-center">
              <div className="relative w-28 h-14 mb-2">
                {b.logo_url ? (
                  <Image
                    src={b.logo_url}
                    alt={b.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs border border-dashed">
                    No Logo
                  </div>
                )}
              </div>
              <span className="text-sm text-center font-medium">{b.name}</span>
              <span className="text-[11px] text-gray-500 mt-1">{b.product_count ?? 0} product{(b.product_count ?? 0) === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm text-gray-500">
        <Link href="../store" className="underline">Back to store</Link>
      </div>
    </div>
  )
}
