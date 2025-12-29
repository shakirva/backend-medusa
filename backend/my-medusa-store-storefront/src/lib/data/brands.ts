"use server"

import { sdk } from "@lib/config"

export type StoreBrand = {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  is_active: boolean
  meta_title?: string | null
  meta_description?: string | null
  display_order: number
  product_count?: number
}

export const listBrands = async (query: Record<string, string> = {}) => {
  query.limit = query.limit || "100"
  query.offset = query.offset || "0"

  const { brands, count } = await sdk.client.fetch<{ brands: StoreBrand[]; count: number }>(
    "/store/brands",
    {
      query,
      cache: "force-cache",
    }
  )

  return { brands, count }
}

export const getBrandBySlug = async (slug: string) => {
  const { brand } = await sdk.client.fetch<{ brand: StoreBrand }>(`/store/brands/${slug}`)
  return brand
}
