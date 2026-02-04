import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Gift } from "@medusajs/icons"
import { Container, Heading, Text, Button, Input } from "@medusajs/ui"
import { useState } from "react"

type Coupon = {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  is_active: boolean
  usage_limit?: number
  used_count: number
  expires_at?: string
  created_at: string
}

const CouponsPage = () => {
  const [coupons] = useState<Coupon[]>([])
  const [isCreating, setIsCreating] = useState(false)

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Heading level="h1" className="text-2xl font-bold">
            Coupons & Discounts
          </Heading>
          <Text className="text-gray-500 mt-1">
            Create and manage promotional coupons for your store
          </Text>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          + Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
              <p className="text-sm text-gray-500">Total Coupons</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => c.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.reduce((sum, c) => sum + c.used_count, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Uses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input placeholder="Search coupons..." className="pl-10" />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Empty State */}
      {coupons.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
          <Text className="text-gray-600 font-medium">No coupons yet</Text>
          <Text className="text-gray-500 text-sm mt-1">
            Create your first promotional coupon to get started
          </Text>
          <Button onClick={() => setIsCreating(true)} className="mt-4" variant="secondary">
            + Create Coupon
          </Button>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {coupon.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coupon.discount_type === "percentage" 
                      ? `${coupon.discount_value}%` 
                      : `$${coupon.discount_value}`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.used_count} / {coupon.usage_limit || "∞"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      coupon.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.expires_at 
                      ? new Date(coupon.expires_at).toLocaleDateString() 
                      : "Never"
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="secondary" size="small">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal placeholder */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <Heading level="h2" className="text-xl font-bold mb-4">Create Coupon</Heading>
            <Text className="text-gray-500 mb-4">
              Coupon functionality coming soon. This is a placeholder page.
            </Text>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsCreating(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Coupons",
  icon: Gift,
})

export default CouponsPage
