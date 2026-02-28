import { ExecArgs } from "@medusajs/framework/types"
import { MEDIA_MODULE } from "../modules/media"
import { Modules } from "@medusajs/framework/utils"

export default async function createSampleHomepage({ container }: ExecArgs) {
  const mediaService = container.resolve(MEDIA_MODULE) as any
  const productService = container.resolve(Modules.PRODUCT) as any

  console.log('🔍 Ensuring hero banners exist...')
  const [existingHero] = await mediaService.listAndCountBanners({ position: 'hero' }, { take: 1 })
  if (!existingHero || existingHero.length === 0) {
    console.log('🖼 Creating sample media and hero banner...')
    const media = await mediaService.createMedias({
      url: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sonos-product-1.webp',
      mime_type: 'image/webp',
      title: 'Sample Hero',
      alt_text: 'Sample Hero',
    })
    const mediaId = Array.isArray(media) ? media[0]?.id : media?.id
    if (mediaId) {
      const banner = await mediaService.createBanners({
        title: 'Sample Hero Banner',
        position: 'hero',
        is_active: true,
        media_id: mediaId,
        display_order: 0,
      })
      console.log('✅ Created sample hero banner', Array.isArray(banner) ? banner[0]?.id : banner?.id)
    } else {
      console.warn('⚠️ Could not create media for hero banner')
    }
  } else {
    console.log('ℹ️ Hero banner already exists — skipping')
  }

  // Tag some products for demo sections
  console.log('🔖 Tagging a few products for demo sections (powerbank, laptop, hot-deal)')
  try {
    const products = await productService.listProducts({}, { take: 20 })
    if (products && products.length) {
      let i = 0
      for (const p of products) {
        const tagsToAdd: string[] = []
        if (i < 4) tagsToAdd.push('powerbank')
        if (i >= 4 && i < 8) tagsToAdd.push('laptop')
        if (i >= 8 && i < 12) tagsToAdd.push('hot-deal')
        if (tagsToAdd.length) {
          try {
            await productService.updateProducts(p.id, { tags: tagsToAdd })
            console.log(`  - Tagged product ${p.id} with ${tagsToAdd.join(',')}`)
          } catch (e) {
            // continue
          }
        }
        i += 1
      }
    } else {
      console.log('ℹ️ No products found to tag in demo')
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.warn('⚠️ Failed to tag demo products:', err?.message || e)
  }

  // If HOMEPAGE_COLLECTIONS env var is present, try to assign products to those collections
  // Expected shape: { "host_deals": "<collection_id>", "best_in_powerbanks": "<collection_id>", "best_in_laptops": "<collection_id>" }
  try {
    if (process.env.HOMEPAGE_COLLECTIONS) {
      let mappings: Record<string, any> = {}
      try { mappings = JSON.parse(process.env.HOMEPAGE_COLLECTIONS) } catch (err) { mappings = {} }
      if (Object.keys(mappings).length) {
        console.log('🔁 Assigning demo products to collections according to HOMEPAGE_COLLECTIONS mapping')

        // Helper to resolve handle->id using container's collectionService when available
        async function resolveCollectionId(candidate: string | undefined) {
          if (!candidate) return null
          // assume id if looks like pcol_
          if (candidate.startsWith('pcol_') || candidate.match(/^[0-9a-fA-F-]{8,}$/)) return candidate
          try {
            const collectionService = container.resolve?.('collectionService') || container.resolve?.('collection')
            if (collectionService) {
              const tryMethods = ['retrieveByHandle', 'getCollectionByHandle', 'getByHandle', 'list']
              for (const m of tryMethods) {
                try {
                  const fn = (collectionService as Record<string, unknown>)[m]
                  if (typeof fn === 'function') {
                    if (m === 'list') {
                      const r = await fn.call(collectionService, { handle: candidate })
                      if (Array.isArray(r) && r.length) return r[0].id
                    } else {
                      const r = await fn.call(collectionService, candidate)
                      if (r && r.id) return r.id
                    }
                  }
                } catch (e) {
                  // continue
                }
              }
            }
          } catch (e) {
            // ignore
          }
          return null
        }

        // Resolve mapping candidates to ids
        const resolvedMappings: Record<string, string> = {}
        for (const k of Object.keys(mappings)) {
          const cand = Array.isArray(mappings[k]) ? mappings[k][0] : mappings[k]
          const id = await resolveCollectionId(cand)
          if (id) resolvedMappings[k] = id
        }

        // Re-query a handful of products to reassign collection_id
        const prods = await productService.listProducts({}, { take: 20 })
        if (prods && prods.length) {
          let i = 0
          for (const p of prods) {
            const updates: any = {}
            // host_deals (i 8..11)
            if (i >= 8 && i < 12 && resolvedMappings['host_deals']) {
              updates.collection_id = resolvedMappings['host_deals']
            }
            // best_in_powerbanks (i 0..3)
            if (i < 4 && resolvedMappings['best_in_powerbanks']) {
              updates.collection_id = resolvedMappings['best_in_powerbanks']
            }
            // best_in_laptops (i 4..7)
            if (i >= 4 && i < 8 && resolvedMappings['best_in_laptops']) {
              updates.collection_id = resolvedMappings['best_in_laptops']
            }
            if (Object.keys(updates).length) {
              try {
                await productService.updateProducts(p.id, updates)
                console.log(`  - Assigned product ${p.id} to collection ${updates.collection_id}`)
              } catch (e) {
                // continue
              }
            }
            i += 1
          }
        }
      }
    }
  } catch (err: unknown) {
    // non-fatal
    const e = err as { message?: string }
    console.warn('⚠️ Failed to assign demo products to collections:', e?.message || err)
  }

  console.log('✅ Sample homepage seed complete')
}
