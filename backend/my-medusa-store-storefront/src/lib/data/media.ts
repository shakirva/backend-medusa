import { MEDUSA_BACKEND_URL } from "../config"

export async function listBanners() {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/media/banners`)
  if (!res.ok) throw new Error("Failed to fetch banners")
  const json = await res.json()
  const banners = json.banners || []
  // Normalize banner image URLs robustly:
  // - If Medusa returned an absolute URL that points to the Medusa backend or any absolute URL
  //   whose pathname looks like a local public asset (for example '/banner/*', '/uploads/*'),
  //   convert it to the pathname so this Next app serves it from /public instead of proxying to backend.
  // - If the URL is already a relative path (starts with '/'), keep it as-is.
  return banners.map((b: any) => {
    if (!b) return b
    const url: string | undefined = b.url || b.image_url || b.src || b.path
    if (!url) return b
    try {
      const origin = MEDUSA_BACKEND_URL.replace(/\/$/, '')

      // If it's already a relative path, keep it
      if (url.startsWith('/')) {
        return { ...b, url }
      }

      // Try parsing as absolute URL. If parsing fails, leave as-is.
      const parsed = new URL(url)
      const pathname = parsed.pathname || url

      // If the absolute URL points to the MEDUSA_BACKEND_URL origin, or its pathname
      // starts with common public prefixes, convert to the pathname so Next serves it locally.
  const publicPrefixes = ['/banner', '/uploads', '/images', '/media', '/static']
      const isSameOrigin = parsed.origin === origin
      const isPublicPath = publicPrefixes.some((p) => pathname.startsWith(p))

      if (isSameOrigin || isPublicPath) {
        return { ...b, url: pathname }
      }

      // Otherwise leave the absolute URL as-is
      return b
    } catch (e) {
      return b
    }
  })
}

export async function listGalleries() {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/media/galleries`)
  if (!res.ok) throw new Error("Failed to fetch galleries")
  const json = await res.json()
  const galleries = json.galleries || []
  // Normalize any media URLs inside galleries similarly to banners
  return galleries.map((g: any) => {
    if (!g) return g
    if (!Array.isArray(g.media)) return g
    const origin = MEDUSA_BACKEND_URL.replace(/\/$/, '')
  const publicPrefixes = ['/banner', '/uploads', '/images', '/media', '/static']

    return {
      ...g,
      media: g.media.map((m: any) => {
        if (!m) return m
        const url: string | undefined = m.url || m.path || m.image_url || m.src
        if (!url) return m

        try {
          if (url.startsWith('/')) return { ...m, url }
          const parsed = new URL(url)
          const pathname = parsed.pathname || url
          const isSameOrigin = parsed.origin === origin
          const isPublicPath = publicPrefixes.some((p) => pathname.startsWith(p))
          if (isSameOrigin || isPublicPath) {
            return { ...m, url: pathname }
          }
          return m
        } catch (e) {
          return m
        }
      }),
    }
  })
}
