import { NextRequest } from "next/server"
import { MEDUSA_BACKEND_URL } from "@lib/config"
import { getDevAdminCookie } from '@lib/dev_admin_store'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // Read raw body as arrayBuffer and forward it to backend preserving the
  // original Content-Type (including multipart boundary). Parsing
  // FormData server-side and then re-sending it can drop file streams and
  // cause multer to receive no file for large uploads (videos). Forwarding
  // the raw body preserves streaming behavior.
  const bodyBuffer = await req.arrayBuffer()
  // Forward to backend upload endpoint with credentials included
  // Forward the client's cookies so the backend can authenticate the admin session.
  // When this route runs server-side, `credentials: 'include'` won't forward the browser cookie,
  // so we explicitly forward the incoming Cookie header.
  const cookie = req.headers.get('cookie') || ''
  // Dev helper: if the request doesn't include a cookie (e.g., curl or cross-origin issues),
  // first try a stored dev-admin session (set via /api/dev-admin-session), then fall back
  // to the env-provided MEDUSA_DEV_ADMIN_COOKIE. WARNING: developer convenience only.
  const devSid = req.cookies?.get?.('dev_admin_sid')?.value || ''
  const storedDevCookie = devSid ? getDevAdminCookie(devSid) : ''
  const devCookie = storedDevCookie || process.env.MEDUSA_DEV_ADMIN_COOKIE || ''
  const cookieToForward = cookie || devCookie
  try {
    const headers: any = {}
    const hasCookie = Boolean(cookieToForward)
    if (cookieToForward) headers.cookie = cookieToForward
    const incomingCT = req.headers.get('content-type')
    if (incomingCT) headers['Content-Type'] = incomingCT
    console.log('[admin-upload-proxy] forwarding upload; hasCookie=', hasCookie, 'incomingCT=', incomingCT, 'bodyBytes=', (bodyBuffer as any)?.byteLength)

    const res = await fetch(`${MEDUSA_BACKEND_URL}/admin/media/upload`, {
      method: 'POST',
      // Forward the raw bytes exactly as received so multer parses multipart correctly
      // Use a permissive any cast so TypeScript in Next.js does not complain about Buffer/Uint8Array types.
      body: bodyBuffer as any,
      headers,
    })

    const ct = res.headers.get("Content-Type") || "application/json"
    const text = await res.text()
    console.log('[admin-upload-proxy] backend status:', res.status, 'content-type:', ct)

    // If backend returned JSON with a relative `url`, convert it to an absolute
    // URL that points to the Medusa backend. This ensures the storefront will
    // be able to load the uploaded file directly (instead of trying to fetch
    // `/static/uploads/...` from the storefront origin and hitting 404/403).
    if (ct.includes('application/json')) {
      try {
        const data = JSON.parse(text || '{}')
        if (data && typeof data.url === 'string' && data.url.startsWith('/')) {
          const base = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.MEDUSA_BACKEND_URL || MEDUSA_BACKEND_URL).replace(/\/$/, '')
          data.url = `${base}${data.url}`
        }
        const body = JSON.stringify(data)
        return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } })
      } catch (e) {
        // If JSON parsing fails, fall back to mirroring the original text
        console.warn('[admin-upload-proxy] failed to parse backend JSON response, returning raw text', e)
        return new Response(text, { status: res.status, headers: { 'Content-Type': ct } })
      }
    }

    // Non-JSON response: mirror as-is
    return new Response(text, { status: res.status, headers: { 'Content-Type': ct } })
  } catch (err: any) {
    console.error('[admin-upload-proxy] error forwarding upload:', err)
    const body = JSON.stringify({ message: 'Upload proxy error', error: err?.message || String(err) })
    return new Response(body, { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
}
