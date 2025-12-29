import { NextRequest, NextResponse } from 'next/server'
import { MEDUSA_BACKEND_URL } from '@lib/config'
import { randomBytes } from 'crypto'
import { setDevAdminCookie } from '@lib/dev_admin_store'

export const dynamic = 'force-dynamic'

// Dev-only: exchange admin credentials for a backend cookie and store it in-memory.
// Protect with an env var to avoid accidental exposure in non-dev environments.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(JSON.stringify({ message: 'Not allowed' }), { status: 403 })
  }

  if (!process.env.ENABLE_DEV_ADMIN_LOGIN) {
    return new NextResponse(JSON.stringify({ message: 'Dev admin login disabled. Set ENABLE_DEV_ADMIN_LOGIN=1 in .env.local to enable.' }), { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const email = body?.email
  const password = body?.password
  if (!email || !password) {
    return new NextResponse(JSON.stringify({ message: 'email and password are required' }), { status: 400 })
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL.replace(/\/$/, '')}/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      // include credentials not necessary here; this is server->server
    })

    const setCookie = res.headers.get('set-cookie') || ''
    if (!setCookie) {
      const text = await res.text().catch(() => '')
      return new NextResponse(JSON.stringify({ message: 'Failed to obtain backend cookie', detail: text }), { status: 502 })
    }

    // generate a session id we will use to retrieve the cookie later
    const sid = randomBytes(12).toString('hex')
    setDevAdminCookie(sid, setCookie)

    // Set a storefront HttpOnly cookie that identifies this dev session id.
    const resp = new NextResponse(JSON.stringify({ message: 'ok', sid }), { status: 200 })
    // cookie valid for 1 day
    resp.headers.append('Set-Cookie', `dev_admin_sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24}`)
    return resp
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ message: 'dev login failed', error: err?.message || String(err) }), { status: 502 })
  }
}
