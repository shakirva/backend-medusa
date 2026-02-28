import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /store/homepage
 * Returns a minimal homepage payload with ordered sections:
 * - hero banners
 * - host_deals (products from "hot-deals" collection)
 * - best_in_powerbanks (products from "best-in-power-banks" collection)
 * - best_in_laptops (products from "best-in-laptops" collection) 
 * - new_arrival (products from "new-arrival" collection)
 * - recommended (latest published products)
 * 
 * IMPORTANT: This API now fetches all available store products first and filters
 * by collection to ensure only products visible to the storefront are returned.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const productService = req.scope.resolve(Modules.PRODUCT) as any

    const origin = (() => {
      const fromEnv = process.env.MEDUSA_URL
      if (fromEnv) return fromEnv.replace(/\/$/, '')
      return `http://localhost:9000`
    })()

    const makeAbsolute = (u: string | null) => {
      if (!u) return null
      if (u.startsWith('http://') || u.startsWith('https://')) return u
      const path = u.startsWith('/') ? u : `/${u}`
      return `${origin}${path}`
    }

    // Helper function to map banner rows to response format
    const mapBanners = (rows: any[]) => (rows || []).map((b: any) => ({
      id: b.id,
      title: b.title || null,
      link: b.link || null,
      position: b.position || null,
      image_url: makeAbsolute(b.image_url || null),
      media: { url: makeAbsolute(b.image_url || null) },
    }))

    // 1) Banners - fetch all types (hero, single, dual, triple)
    const [heroRows] = await mediaService.listAndCountBanners({ is_active: true, position: "hero" }, { order: { display_order: "ASC" }, take: 12 })
    const [singleRows] = await mediaService.listAndCountBanners({ is_active: true, position: "single" }, { order: { display_order: "ASC" }, take: 4 })
    const [dualRows] = await mediaService.listAndCountBanners({ is_active: true, position: "dual" }, { order: { display_order: "ASC" }, take: 4 })
    const [tripleRows] = await mediaService.listAndCountBanners({ is_active: true, position: "triple" }, { order: { display_order: "ASC" }, take: 6 })

    const banners = mapBanners(heroRows)
    const singleBanners = mapBanners(singleRows)
    const dualBanners = mapBanners(dualRows)
    const tripleBanners = mapBanners(tripleRows)

    // Load optional collection-first mapping from env var. Expected shape:
    // { "host_deals": "pcol_..." } or allow handles: { "host_deals": "powerbanks" }
    let sectionCollections: Record<string, any> = {}
    try {
      if (process.env.HOMEPAGE_COLLECTIONS) {
        sectionCollections = JSON.parse(process.env.HOMEPAGE_COLLECTIONS)
      }
    } catch (err) {
      // ignore parse errors and treat as no mapping
      sectionCollections = {}
    }

    // Cache for resolved handles -> ids during this request
    const _resolvedCollectionIds: Record<string, string | null> = {}

    // Try to resolve a collection candidate (id or handle) to a collection id.
    async function resolveCollectionId(candidate: string | undefined) {
      if (!candidate) return null
      if (_resolvedCollectionIds[candidate] !== undefined) return _resolvedCollectionIds[candidate]

      // If it already looks like an ID (pcol_ prefix or uuid-like), assume it's an id
      if (typeof candidate === 'string' && (candidate.startsWith('pcol_') || candidate.match(/^[0-9a-fA-F-]{8,}$/))) {
        _resolvedCollectionIds[candidate] = candidate
        return candidate
      }

      // Try to resolve via an available collection service in the DI container
      try {
        // Many setups register the collection service under different names; try several
        let collectionService: any = null
        const tryNames = ['collectionService', 'collection', 'productCollectionService', 'product_collection', 'productCollection']
        for (const n of tryNames) {
          try {
            collectionService = req.scope.resolve?.(n)
            if (collectionService) break
          } catch (err) {
            // ignore
          }
        }
        if (collectionService) {
          // Try several likely method names
          const tryMethods = [
            'retrieveByHandle',
            'getCollectionByHandle',
            'getByHandle',
            'retrieve',
            'get',
            'list',
          ]
          for (const m of tryMethods) {
            try {
              const fn = collectionService[m]
              if (typeof fn === 'function') {
                // If it's a list-like method, accept filter by handle
                if (m === 'list') {
                  const r = await fn.call(collectionService, { handle: candidate })
                  if (Array.isArray(r) && r.length) {
                    _resolvedCollectionIds[candidate] = r[0].id
                    return _resolvedCollectionIds[candidate]
                  }
                } else {
                  const r = await fn.call(collectionService, candidate)
                  if (r && r.id) {
                    _resolvedCollectionIds[candidate] = r.id
                    return _resolvedCollectionIds[candidate]
                  }
                }
              }
            } catch (e) {
              // ignore and try next
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // Final fallback: don't resolve
      _resolvedCollectionIds[candidate] = null
      return null
    }

    // Helper to fetch products for a section: prefer collection mapping, fall back to tag-based list
    // Default handle candidates to try when no explicit mapping provided.
    const DEFAULT_SECTION_HANDLE_CANDIDATES: Record<string, string[]> = {
      host_deals: ['hot-deals', 'hot_deal', 'hot-deals'],
      best_in_powerbanks: ['powerbanks', 'powerbank'],
      best_in_laptops: ['laptops', 'laptop'],
      recommended: ['recommended', 'featured'],
    }

    async function productsForSection({ sectionId, tag, take = 8 }: { sectionId: string; tag?: string; take?: number }) {
      // 1) Try collection-based mapping (collection_id expected). Support handles by resolving to ids.
      try {
        let collectionCandidate = sectionCollections?.[sectionId]
        if (collectionCandidate) {
          // If mapping is an array, pick first
          if (Array.isArray(collectionCandidate)) collectionCandidate = collectionCandidate[0]
          const resolved = await resolveCollectionId(collectionCandidate)
          if (resolved) {
            try {
              const byCollection = await productService.listProducts({ collection_id: resolved }, { take })
              if (Array.isArray(byCollection) ? byCollection.length > 0 : (byCollection && byCollection.length)) {
                return byCollection
              }
            } catch (e) {
              // continue to tag fallback
            }
          }
        }
        // 1b) No explicit mapping or resolution failed: try default handle candidates for this section
        const candidates = DEFAULT_SECTION_HANDLE_CANDIDATES[sectionId]
        if (!collectionCandidate && Array.isArray(candidates)) {
          for (const cand of candidates) {
            try {
              const resolvedCand = await resolveCollectionId(cand)
              if (resolvedCand) {
                const byCollection = await productService.listProducts({ collection_id: resolvedCand }, { take })
                if (Array.isArray(byCollection) ? byCollection.length > 0 : (byCollection && byCollection.length)) {
                  return byCollection
                }
              }
            } catch (e) {
              // ignore and try next
            }
          }
        }
      } catch (e) {
        // continue to tag fallback
      }

      // 2) Fallback to tag-based lookup when available
      if (tag) {
        try {
          const byTag = await productService.listProducts({ tags: [tag] }, { take })
          return byTag || []
        } catch (e) {
          return []
        }
      }

      return []
    }

  // Helper to validate products exist by checking if they can be retrieved
  // This filters out ghost products that were deleted but still have stale collection links
  async function validateProducts(products: any[]): Promise<any[]> {
    if (!products || !products.length) return []
    const validProducts: any[] = []
    for (const p of products) {
      if (!p || !p.id) continue
      try {
        // Try to retrieve the product to confirm it exists
        const retrieved = await productService.retrieveProduct(p.id)
        if (retrieved && retrieved.id) {
          validProducts.push(p)
        }
      } catch (err) {
        // Product doesn't exist - skip it
        console.log(`Skipping non-existent product: ${p.id}`)
      }
    }
    return validProducts
  }

  // Get all available products (limited set from store) and group by collection
  // This ensures we only return products that are actually accessible via the store API
  let allStoreProducts: any[] = []
  try {
    // Fetch products with collection_id expanded so we can filter by collection
    allStoreProducts = await productService.listProducts(
      { status: 'published' },
      { 
        take: 200, 
        order: { created_at: 'DESC' },
        relations: ['collection']
      }
    )
    // Filter out products without a valid id
    allStoreProducts = (allStoreProducts || []).filter((p: any) => p && p.id)
  } catch (e) {
    console.log('Failed to fetch all products:', e)
    allStoreProducts = []
  }

  // Collection handle to products mapping
  const COLLECTION_HANDLES: Record<string, string[]> = {
    host_deals: ['hot-deals'],
    best_in_powerbanks: ['best-in-power-banks', 'powerbanks', 'powerbank'],
    best_in_laptops: ['best-in-laptops', 'laptops', 'laptop'],
    new_arrival: ['new-arrival', 'new-arrivals'],
    recommended: ['recommended', 'featured'],
  }

  // Function to get products for a section based on collection
  function getProductsForSection(sectionId: string, limit = 12): any[] {
    const handles = COLLECTION_HANDLES[sectionId] || []
    const sectionProducts = allStoreProducts.filter((p: any) => {
      if (!p.collection_id && !p.collection) return false
      const collHandle = p.collection?.handle || ''
      return handles.some(h => collHandle.toLowerCase() === h.toLowerCase())
    })
    return sectionProducts.slice(0, limit)
  }

  // Get products for each section
  const hostDeals = getProductsForSection('host_deals', 8)
  const powerbanks = getProductsForSection('best_in_powerbanks', 8)
  const laptops = getProductsForSection('best_in_laptops', 8)
  const newArrivals = getProductsForSection('new_arrival', 12)
  
  // Recommended: use collection-based first, then fall back to all available products
  let recommended = getProductsForSection('recommended', 12)
  if (!recommended.length) {
    // Fall back to the latest products
    recommended = allStoreProducts.slice(0, 12)
  }

    // For frontend convenience, include both lightweight item refs (product_id)
    // and denormalized product objects under `products` for each product_grid section.
    const sections = [
      { id: 'hero', type: 'banner', items: banners },
      { id: 'single_banner', type: 'banner', position: 'single', items: singleBanners },
      { id: 'dual_banner', type: 'banner', position: 'dual', items: dualBanners },
      { id: 'triple_banner', type: 'banner', position: 'triple', items: tripleBanners },
      {
        id: 'host_deals',
        type: 'product_grid',
        title: 'Host Deals',
        items: (hostDeals || []).map((p: any) => ({ id: p.id, type: 'product', product_id: p.id })),
        products: hostDeals || [],
      },
      {
        id: 'best_in_powerbanks',
        type: 'product_grid',
        title: 'Best in Powerbanks',
        items: (powerbanks || []).map((p: any) => ({ id: p.id, type: 'product', product_id: p.id })),
        products: powerbanks || [],
      },
      {
        id: 'best_in_laptops',
        type: 'product_grid',
        title: 'Best in Laptops',
        items: (laptops || []).map((p: any) => ({ id: p.id, type: 'product', product_id: p.id })),
        products: laptops || [],
      },
      {
        id: 'new_arrival',
        type: 'product_grid',
        title: 'New Arrivals',
        items: (newArrivals || []).map((p: any) => ({ id: p.id, type: 'product', product_id: p.id })),
        products: newArrivals || [],
      },
      {
        id: 'recommended',
        type: 'product_grid',
        title: 'Recommended',
        items: (recommended || []).map((p: any) => ({ id: p.id, type: 'product', product_id: p.id })),
        products: recommended || [],
      },
    ]

    // Also include banners separately at top level for easier frontend access
    res.json({ 
      locale: req.query.locale || 'en', 
      generated_at: new Date().toISOString(), 
      sections,
      banners: {
        hero: banners,
        single: singleBanners,
        dual: dualBanners,
        triple: tripleBanners,
      }
    })
  } catch (e: any) {
    console.error('Homepage endpoint error:', e)
    res.status(500).json({ message: e?.message || 'Failed to build homepage' })
  }
}
