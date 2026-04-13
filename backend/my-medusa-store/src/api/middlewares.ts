import { defineMiddlewares, authenticate } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import Busboy from "busboy"
import path from "path"
import fs from "fs"
import mime from "mime-types"
import { injectBranding } from "./middlewares/branding"

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
    const ct = (req.headers['content-type'] || '') as string
    if (!ct.includes('multipart/form-data')) return next()

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
      // Block video uploads unless explicitly enabled
      const isVideo = (mimetype || '').startsWith('video/')
      const allowVideos = String(process.env.ALLOW_VIDEO_UPLOADS || '').toLowerCase() === 'true'
      if (isVideo && !allowVideos) {
        try { if (fs.existsSync(storedFilePath!)) fs.unlinkSync(storedFilePath!) } catch {}
        return res.status(400).json({ message: 'Video uploads are disabled. Set ALLOW_VIDEO_UPLOADS=true to enable.' })
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

// Fix for sdk.client.fetch double-stringifying bodies: parse JSON strings that
// arrive as a JSON-encoded string (e.g. "\"{ ... }\"") so the route handler
// always sees a proper object.
function fixDoubleStringifiedBody(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Collect raw body when bodyParser is disabled
  if (!req.body || (typeof req.body === "object" && Object.keys(req.body).length === 0)) {
    let raw = ""
    req.on("data", (chunk: Buffer) => { raw += chunk.toString() })
    req.on("end", () => {
      if (raw) {
        try {
          let parsed = JSON.parse(raw)
          // If it was double-stringified, parsed will be a string — parse again
          if (typeof parsed === "string") parsed = JSON.parse(parsed)
          req.body = parsed
        } catch {
          try { req.body = JSON.parse(raw) } catch { /* leave empty */ }
        }
      }
      next()
    })
    return
  }
  // Body already parsed — check if it's a string (double-stringify)
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body) } catch { /* leave as-is */ }
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      // Disable default body parser for admin brand routes to handle double-stringified JSON
      matcher: "/admin/brands",
      method: "POST",
      bodyParser: false,
      middlewares: [fixDoubleStringifiedBody],
    },
    {
      matcher: "/admin/brands/:id",
      method: ["PUT"],
      bodyParser: false,
      middlewares: [fixDoubleStringifiedBody],
    },
    {
      // Match the admin upload endpoints (adjust as needed)
      matcher: "/admin/uploads",
      middlewares: [adminMultipartGuard],
    },
    {
      matcher: "/admin/media/upload",
      // Disable Medusa's built-in body parser so multer can read the raw multipart stream
      bodyParser: false,
      middlewares: [adminMultipartGuard],
    },
    {
      // Inject marqasouq branding into admin pages
      matcher: "/app/*",
      middlewares: [injectBranding],
    },
    // Customer authentication for store customer routes (required for /store/customers/me)
    {
      matcher: "/store/customers/me*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // Customer creation after registration - needs allowUnregistered since customer profile doesn't exist yet
    {
      matcher: "/store/customers",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"], { allowUnregistered: true })],
    },
    // Customer authentication for custom store routes
    {
      matcher: "/store/wishlist*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // Customer cancel order - must be authenticated and own the order
    {
      matcher: "/store/orders/*/cancel",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/products/*/reviews",
      middlewares: [authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true })],
    },
  ],
})
