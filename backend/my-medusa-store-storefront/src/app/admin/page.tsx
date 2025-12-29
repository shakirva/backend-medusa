import Link from "next/link"

export const metadata = {
  title: "Admin - Minimal",
}

export default function AdminIndex() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Minimal Admin</h1>
      <p className="mb-6">Use these simple forms to create Brands, Media and Galleries.</p>

      <ul className="space-y-3">
        <li>
          <Link href="/admin/brands" className="text-blue-600">Manage Brands</Link>
        </li>
        <li>
          <Link href="/admin/media" className="text-blue-600">Manage Media</Link>
        </li>
        <li>
          <Link href="/admin/galleries" className="text-blue-600">Manage Galleries</Link>
        </li>
      </ul>
    </div>
  )
}
