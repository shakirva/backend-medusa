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
console.log("Upload directory:", uploadDir)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")
    cb(null, `${ts}-${safe}`)
  },
})

// Configure upload limits. Allow larger defaults when video uploads are enabled.
const allowVideosEnv = String(process.env.ALLOW_VIDEO_UPLOADS || '').toLowerCase() === 'true'
const defaultMax = allowVideosEnv ? 200 * 1024 * 1024 : 10 * 1024 * 1024 // 200MB or 10MB
const maxSize = parseInt(String(process.env.MAX_UPLOAD_SIZE || ''), 10) || defaultMax
const upload = multer({ storage, limits: { fileSize: maxSize } })

// Medusa route handlers can export a default function for custom processing
export default async function (req: MedusaRequest, res: MedusaResponse) {
  console.log("=== UPLOAD ENDPOINT HIT ===")
  console.log("Method:", req.method)
  console.log("Headers:", Object.keys(req.headers))
  console.log("Content-Type:", req.headers['content-type'])
  
  await new Promise<void>((resolve, reject) => {
    upload.single("file")(req as any, res as any, (err: any) => {
      if (err) {
        console.error("Multer error:", err)
        return reject(err)
      }
      resolve()
    })
  })

  const file = (req as any).file as any
  if (!file) {
    console.error("No file received in upload")
    return res.status(400).json({ message: "No file uploaded" })
  }
  console.log("File uploaded successfully:", file.filename, file.path)
  // Video uploads: allow when explicitly enabled via env var
  // Set ALLOW_VIDEO_UPLOADS=true in backend .env to permit video file uploads.
  const mimetype = file.mimetype || ''
  const allowVideos = String(process.env.ALLOW_VIDEO_UPLOADS || '').toLowerCase() === 'true'
  if (mimetype.startsWith("video/") && !allowVideos) {
    console.warn("Video upload attempted but ALLOW_VIDEO_UPLOADS is not enabled - rejecting and removing file:", file.path)
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
    } catch (e) {
      console.error("Failed to remove rejected video file:", e)
    }
    return res.status(400).json({ message: "Video uploads are not allowed. Enable ALLOW_VIDEO_UPLOADS=true to permit." })
  }

  console.log("File exists?", fs.existsSync(file.path))
  console.log("File size:", fs.statSync(file.path).size)
  const relative = `/static/uploads/${path.basename(file.path)}`
  console.log("Returning URL:", relative)

  res.json({ url: relative, filename: file.originalname })
}
