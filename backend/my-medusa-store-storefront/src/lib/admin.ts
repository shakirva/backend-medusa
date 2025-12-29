import { MEDUSA_BACKEND_URL } from "@lib/config"

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    credentials: "include",
    headers: { ...(opts.headers || {}), "Content-Type": "application/json" },
    ...opts,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`API ${path} failed (${res.status}) ${txt}`)
  }
  return res.json()
}

export async function createBrand(body: any) {
  return req(`/admin/brands`, { method: "POST", body: JSON.stringify(body) })
}

export async function listBrands() {
  return req(`/admin/brands`)
}

export async function listMedia() {
  return req(`/admin/media`)
}

export async function createMedia(body: any) {
  return req(`/admin/media`, { method: "POST", body: JSON.stringify(body) })
}

export async function listGalleries() {
  return req(`/admin/media/galleries`)
}

export async function createGallery(body: any) {
  return req(`/admin/media/galleries`, { method: "POST", body: JSON.stringify(body) })
}

export async function addMediaToGallery(galleryId: string, body: any) {
  return req(`/admin/media/galleries/${galleryId}/media`, { method: "POST", body: JSON.stringify(body) })
}

export async function removeMediaFromGallery(galleryId: string, mediaId: string) {
  return req(`/admin/media/galleries/${galleryId}/media/${mediaId}`, { method: "DELETE" })
}

export async function updateMedia(id: string, body: any) {
  return req(`/admin/media/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export async function deleteMedia(id: string) {
  return req(`/admin/media/${id}`, { method: "DELETE" })
}

export async function updateGallery(id: string, body: any) {
  return req(`/admin/media/galleries/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export async function deleteGallery(id: string) {
  return req(`/admin/media/galleries/${id}`, { method: "DELETE" })
}

export async function listBanners() {
  return req(`/admin/media/banners`)
}

export async function createBanner(body: any) {
  return req(`/admin/media/banners`, { method: "POST", body: JSON.stringify(body) })
}

export async function deleteBanner(id: string) {
  return req(`/admin/media/banners/${id}`, { method: "DELETE" })
}

export async function updateBanner(id: string, body: any) {
  return req(`/admin/media/banners/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

// Sellers Admin
export async function listSellerRequests(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ""
  return req(`/admin/seller-requests${qs}`)
}

export async function updateSellerRequest(id: string, body: any) {
  return req(`/admin/seller-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export async function listSellers() {
  return req(`/admin/sellers`)
}

export async function createSeller(body: any) {
  return req(`/admin/sellers`, { method: "POST", body: JSON.stringify(body) })
}

export async function getSeller(id: string) {
  return req(`/admin/sellers/${id}`)
}

export async function updateSeller(id: string, body: any) {
  return req(`/admin/sellers/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export async function linkSellerProduct(id: string, body: any) {
  return req(`/admin/sellers/${id}/products`, { method: "POST", body: JSON.stringify(body) })
}

export async function unlinkSellerProduct(id: string, productId: string) {
  return req(`/admin/sellers/${id}/products/${encodeURIComponent(productId)}`, { method: "DELETE" })
}

// Warranty Admin
export async function listWarranties(query?: { email?: string; product_id?: string }) {
  const qs = query ?
    `?${new URLSearchParams(Object.fromEntries(Object.entries(query).filter(([_,v]) => v))).toString()}` :
    ""
  return req(`/admin/warranty${qs}`)
}

export async function getWarranty(id: string) {
  return req(`/admin/warranty/${id}`)
}

export async function updateWarranty(id: string, body: any) {
  return req(`/admin/warranty/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export async function listWarrantyClaims(query?: { status?: string; warranty_id?: string }) {
  const qs = query ?
    `?${new URLSearchParams(Object.fromEntries(Object.entries(query).filter(([_,v]) => v))).toString()}` :
    ""
  return req(`/admin/warranty/claims${qs}`)
}

export async function getWarrantyClaim(id: string) {
  return req(`/admin/warranty/claims/${id}`)
}

export async function updateWarrantyClaim(id: string, body: any) {
  return req(`/admin/warranty/claims/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export default {
  createBrand,
  listBrands,
  listMedia,
  createMedia,
  updateMedia,
  deleteMedia,
  listGalleries,
  createGallery,
  updateGallery,
  deleteGallery,
  addMediaToGallery,
  removeMediaFromGallery,
  listBanners,
  createBanner,
  deleteBanner,
  updateBanner,
  // sellers
  listSellerRequests,
  updateSellerRequest,
  listSellers,
  createSeller,
  getSeller,
  updateSeller,
  linkSellerProduct,
  unlinkSellerProduct,
  // warranty
  listWarranties,
  getWarranty,
  updateWarranty,
  listWarrantyClaims,
  getWarrantyClaim,
  updateWarrantyClaim,
}
