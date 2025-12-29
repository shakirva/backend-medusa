import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /store/homepage
 * Returns a minimal homepage payload with ordered sections:
 * - hero banners
 * - host_deals (products tagged 'hot-deal')
 * - best_in_powerbanks (products tagged 'powerbank')
 * - best_in_laptops (products tagged 'laptop')
 * - recommended (latest published products)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mediaService = req.scope.resolve(MEDIA_MODULE) as any
    const productService = req.scope.resolve(Modules.PRODUCT) as any

    // 1) Banners (hero)
    const [heroRows] = await mediaService.listAndCountBanners({ is_active: true, position: "hero" }, { order: { display_order: "ASC" }, take: 12 })

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

    const banners = (heroRows || []).map((b: any) => ({
      id: b.id,
      title: b.title || null,
      link: b.link || null,
      image_url: makeAbsolute(b.image_url || null),
    }))

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

  const hostDeals = await productsForSection({ sectionId: 'host_deals', tag: 'hot-deal', take: 8 })
  const powerbanks = await productsForSection({ sectionId: 'best_in_powerbanks', tag: 'powerbank', take: 8 })
  const laptops = await productsForSection({ sectionId: 'best_in_laptops', tag: 'laptop', take: 8 })
  // New Arrivals: prefer collection mapping (new_arrival) then fall back to latest products
  const newArrivals = await productsForSection({ sectionId: 'new_arrival', take: 12 })

    // Recommended: prefer collection mapping, otherwise fall back to latest published products
    let recommended = []
    try {
      // try section mapping first
      const mapped = await productsForSection({ sectionId: 'recommended', take: 12 })
      if (mapped && mapped.length) {
        recommended = mapped
      } else {
        recommended = await productService.listProducts({}, { take: 12, order: { created_at: 'DESC' } })
      }
    } catch (e) {
      recommended = []
    }

    // For frontend convenience, include both lightweight item refs (product_id)
    // and denormalized product objects under `products` for each product_grid section.
    const sections = [
      { id: 'hero', type: 'banner', items: banners },
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

    res.json({ locale: req.query.locale || 'en', generated_at: new Date().toISOString(), sections })
  } catch (e: any) {
    console.error('Homepage endpoint error:', e)
    res.status(500).json({ message: e?.message || 'Failed to build homepage' })
  }
}
