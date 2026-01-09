import path from "path"
import fs from "fs"
import multer from "multer"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Debug-only: do NOT authenticate so we can test uploads by curl

const uploadDir = path.join(process.cwd(), "static", "uploads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g,'_')}`),
})
const upload = multer({ storage })

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    await new Promise<void>((resolve, reject) => {
      upload.any()(req as any, res as any, (err: any) => {
        if (err) return reject(err)
        resolve()
      })
    })

    const files = (req as any).files
    if (!files || files.length === 0) return res.status(400).json({ message: 'no files' })
    const file = files[0]
    const relative = `/static/uploads/${path.basename(file.path)}`
    return res.json({ ok: true, saved: relative })
  } catch (e: any) {
    console.error('debug upload failed', e)
    return res.status(500).json({ message: e?.message })
  }
}
