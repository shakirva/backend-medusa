import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import path from "path"
import fs from "fs"

export const AUTHENTICATE = true

// Save files under static/uploads
const uploadDir = path.join(process.cwd(), "static", "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")
    cb(null, `${ts}-${safe}`)
  },
})

// Re-evaluated per request so env vars are always current
function getUpload() {
  const allowVideos = String(process.env.ALLOW_VIDEO_UPLOADS || '').toLowerCase() === 'true'
  const defaultMax = allowVideos ? 200 * 1024 * 1024 : 10 * 1024 * 1024
  const maxSize = parseInt(String(process.env.MAX_UPLOAD_SIZE || ''), 10) || defaultMax
  return multer({ storage, limits: { fileSize: maxSize } })
}

// IMPORTANT: Medusa v2 requires named HTTP method exports (GET, POST, etc.)
// A default export is NOT recognized by Medusa's router and causes 404.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const upload = getUpload()

  try {
    await new Promise<void>((resolve, reject) => {
      upload.single("file")(req as any, res as any, (err: any) => {
        if (err) return reject(err)
        resolve()
      })
    })
  } catch (err: any) {
    console.error("Multer upload error:", err)
    return res.status(400).json({ message: err?.message || "Upload failed" })
  }

  const file = (req as any).file as any
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" })
  }

  // Block video uploads unless explicitly enabled
  const mimetype = file.mimetype || ''
  const allowVideos = String(process.env.ALLOW_VIDEO_UPLOADS || '').toLowerCase() === 'true'
  if (mimetype.startsWith("video/") && !allowVideos) {
    try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path) } catch (_) {}
    return res.status(400).json({ message: "Video uploads are disabled. Set ALLOW_VIDEO_UPLOADS=true to enable." })
  }

  const relative = `/static/uploads/${path.basename(file.path)}`
  return res.json({ url: relative, filename: file.originalname })
}
