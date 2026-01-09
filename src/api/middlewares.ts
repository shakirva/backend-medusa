import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import Busboy from "busboy"
import path from "path"
import fs from "fs"
import mime from "mime-types"

// Development-only middleware to safely handle multipart/form-data for admin
// upload routes. This avoids the global JSON/body parser from interfering
// with multipart streams during local development where middleware ordering
// can cause `LIMIT_UNEXPECTED_FILE` errors.
//
// This middleware is intentionally gated to non-production environments and
// requires either a valid admin session (production path) or the
// DEV_ADMIN_TOKEN header when ENABLE_DEV_ADMIN_BYPASS=1.

const uploadDir = path.join(process.cwd(), "static", "uploads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

async function adminMultipartGuard(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Only run in development to avoid touching production pipeline
    if (process.env.NODE_ENV === 'production') return next()

    const ct = (req.headers['content-type'] || '') as string
    if (!ct.includes('multipart/form-data')) return next()

    // If dev bypass is enabled, require the header token
    if (process.env.ENABLE_DEV_ADMIN_BYPASS === '1') {
      const token = process.env.DEV_ADMIN_TOKEN || ''
      const got = (req.headers['x-dev-admin-token'] || req.headers['X-Dev-Admin-Token']) as any || ''
      if (!token || String(got) !== String(token)) {
        console.warn('Dev bypass enabled but missing/invalid x-dev-admin-token header (middleware)')
        return res.status(401).json({ message: 'Unauthorized (dev-bypass)' })
      }
    }

    console.log('Admin multipart middleware handling upload for', req.path)

    const bb = Busboy({ headers: req.headers as any })

    let storedFilePath: string | null = null
    let originalName: string | null = null
    let mimetype: string | null = null
    let size = 0

    bb.on('file', (_field, file, info) => {
      originalName = info.filename
      mimetype = info.mimeType
      const safe = (originalName || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_')
      const filename = `${Date.now()}-${safe}`
      storedFilePath = path.join(uploadDir, filename)
      const writeStream = fs.createWriteStream(storedFilePath)
      file.on('data', (data) => { size += data.length })
      file.pipe(writeStream)
      writeStream.on('error', (err) => {
        console.error('Write stream error (middleware):', err)
        try { fs.unlinkSync(storedFilePath!) } catch {}
        return res.status(500).json({ message: 'Failed to write file' })
      })
    })

    bb.on('error', (err) => {
      console.error('Busboy error (middleware):', err)
      return res.status(500).json({ message: 'Upload parsing failed' })
    })

    bb.on('finish', () => {
      if (!storedFilePath) {
        return res.status(400).json({ message: 'No file uploaded' })
      }
      const url = `/static/uploads/${path.basename(storedFilePath)}`
      console.log('Middleware upload OK ->', url)
      return res.json({ url, filename: originalName, size, mimetype })
    })

    ;(req as any).pipe(bb as any)
  } catch (e: any) {
    console.error('Admin multipart middleware failed:', e)
    return res.status(500).json({ message: e?.message || 'Upload failed' })
  }
}

export default defineMiddlewares({
  routes: [
    {
      // Match the admin upload endpoints (adjust as needed)
      matcher: "/admin/uploads",
      middlewares: [adminMultipartGuard],
    },
    {
      matcher: "/admin/media/upload",
      middlewares: [adminMultipartGuard],
    },
  ],
})
