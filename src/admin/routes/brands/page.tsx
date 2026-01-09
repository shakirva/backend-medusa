import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import { Container, Heading, Button, Input, Text, clx, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Brand = {
  id: string
  name: string
  slug?: string
  description?: string
  logo_url?: string
  banner_url?: string
  is_active: boolean
  created_at: string
}

type BrandsResponse = {
  brands: Brand[]
  count: number
  offset: number
  limit: number
}

const BrandCard = ({ 
  brand, 
  onEdit, 
  onDelete 
}: { 
  brand: Brand
  onEdit: (brand: Brand) => void
  onDelete: (id: string) => void
}) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-200 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Logo Container - Pill Shape */}
      <div className="p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-32 h-16 rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden border border-gray-100">
          {brand.logo_url ? (
            <img 
              src={brand.logo_url} 
              alt={brand.name}
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          ) : (
            <div className="flex items-center justify-center text-gray-400">
              <TagSolid className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{brand.name}</h3>
          <Badge color={brand.is_active ? "green" : "grey"} size="small">
            {brand.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {brand.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{brand.description}</p>
        )}
      </div>

      {/* Hover Actions */}
      <div 
        className={clx(
          "absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-200",
          showActions ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button 
          variant="secondary" 
          size="small"
          onClick={() => onEdit(brand)}
          className="bg-white hover:bg-gray-50"
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="small"
          onClick={() => onDelete(brand.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

const BrandFormDrawer = ({
  isOpen,
  onClose,
  brand,
  onSave
}: {
  isOpen: boolean
  onClose: () => void
  brand: Brand | null
  onSave: (data: any) => void
}) => {
  const [name, setName] = useState(brand?.name || "")
  const [description, setDescription] = useState(brand?.description || "")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState(brand?.logo_url || "")
  const [isActive, setIsActive] = useState(brand?.is_active ?? true)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      let logoUrl = brand?.logo_url || ""
      
      if (logoFile) {
        const formData = new FormData()
        formData.append("files", logoFile)
        const uploadRes = await fetch("/admin/uploads", {
          method: "POST",
          body: formData,
          credentials: "include"
        })
        const uploadData = await uploadRes.json()
        if (uploadData.uploads?.[0]?.url) {
          logoUrl = uploadData.uploads[0].url
        }
      }

      onSave({
        id: brand?.id,
        name,
        description,
        logo_url: logoUrl,
        is_active: isActive
      })
    } catch (error) {
      console.error("Error saving brand:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container - Centered */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {brand ? "Edit Brand" : "Create Brand"}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Brand Logo</label>
              <div className="flex justify-center">
                <div className="w-48 h-24 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative cursor-pointer group hover:border-blue-400 transition-colors">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview"
                      className="max-w-[85%] max-h-[85%] object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <TagSolid className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-500 block">Click to upload logo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <span className="text-white text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {logoPreview ? "Change" : "Upload"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter brand name"
                className="w-full"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter brand description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              />
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700 block">Active Status</span>
                <span className="text-xs text-gray-500">Brand will be visible on the store</span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={clx(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive ? "bg-green-500" : "bg-gray-300"
                )}
              >
                <span
                  className={clx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="w-full sm:w-auto justify-center"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!name.trim() || isLoading}
              className="w-full sm:w-auto justify-center"
            >
              {isLoading ? "Saving..." : (brand ? "Update Brand" : "Create Brand")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const BrandsPage = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const { data, isLoading, error } = useQuery<BrandsResponse>({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/brands", {
        method: "GET"
      })
      return response as BrandsResponse
    }
  })

  const createMutation = useMutation({
    mutationFn: async (brandData: any) => {
      return sdk.client.fetch("/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: brandData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      setIsDrawerOpen(false)
      setEditingBrand(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (brandData: any) => {
      return sdk.client.fetch(`/admin/brands/${brandData.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: brandData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      setIsDrawerOpen(false)
      setEditingBrand(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return sdk.client.fetch(`/admin/brands/${id}`, {
        method: "DELETE"
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    }
  })

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setIsDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleSave = (data: any) => {
    if (data.id) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleOpenCreate = () => {
    setEditingBrand(null)
    setIsDrawerOpen(true)
  }

  const filteredBrands = data?.brands?.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const stats = {
    total: data?.brands?.length || 0,
    active: data?.brands?.filter(b => b.is_active).length || 0,
    inactive: data?.brands?.filter(b => !b.is_active).length || 0
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Container className="py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Heading level="h1" className="text-2xl font-bold text-gray-900">
              Brands Management
            </Heading>
            <Text className="text-gray-500 mt-1">
              Manage your store brands with pill-shaped logos shakir
            </Text>
          </div>
          <Button onClick={handleOpenCreate} className="sm:w-auto w-full">
            + Add New Brand
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TagSolid className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Brands</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Brands</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-sm text-gray-500">Inactive Brands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="pl-10"
            />
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

        {/* Brands Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <Text className="text-red-600 font-medium">Failed to load brands</Text>
            <Text className="text-gray-500 text-sm mt-1">Please try again later</Text>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TagSolid className="w-8 h-8 text-gray-400" />
            </div>
            <Text className="text-gray-600 font-medium">
              {searchQuery ? "No brands found" : "No brands yet"}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Add your first brand to get started"}
            </Text>
            {!searchQuery && (
              <Button onClick={handleOpenCreate} className="mt-4" variant="secondary">
                + Add Brand
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map(brand => (
              <BrandCard 
                key={brand.id} 
                brand={brand} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Brand Form Drawer */}
        <BrandFormDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setEditingBrand(null)
          }}
          brand={editingBrand}
          onSave={handleSave}
        />
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
