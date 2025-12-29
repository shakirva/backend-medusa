import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const dir = path.join(process.cwd(), "static", "uploads")
    if (!fs.existsSync(dir)) return res.json({ files: [] })
    const files = fs.readdirSync(dir).map((f) => {
      const stat = fs.statSync(path.join(dir, f))
      return { name: f, size: stat.size, mtime: stat.mtime }
    })
    return res.json({ files })
  } catch (e: any) {
    console.error("Failed to list uploads:", e)
    return res.status(500).json({ message: e?.message || 'failed' })
  }
}
