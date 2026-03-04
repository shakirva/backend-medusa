import path from "path"
import fs from "fs"
import multer from "multer"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Debug-only: public, unauthenticated upload endpoint for CLI testing.
// NOTE: Keep this file only for local debugging. Remove or protect before any production use.

const uploadDir = path.join(process.cwd(), "static", "uploads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g,'_')}`),
})
const upload = multer({ storage })

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // log some request info to help debug auth/middleware issues
    console.log('=== debug upload POST /api/uploads/test-unauthed ===')
    console.log('headers:', JSON.stringify(req.headers))

    await new Promise<void>((resolve, reject) => {
      upload.any()(req as any, res as any, (err: any) => {
        if (err) return reject(err)
        resolve()
      })
    })

    const files = (req as any).files
    if (!files || files.length === 0) {
      console.log('no files in request')
      return res.status(400).json({ message: 'no files' })
    }

    const file = files[0]
    const relative = `/static/uploads/${path.basename(file.path)}`

    console.log('saved file ->', file.path)
    return res.json({ ok: true, saved: relative })
  } catch (e: any) {
    console.error('debug upload failed', e)
    return res.status(500).json({ message: e?.message ?? String(e) })
  }
}
