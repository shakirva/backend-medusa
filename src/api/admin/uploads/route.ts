import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"
import Busboy from "busboy"

export const AUTHENTICATE = false

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "static", "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("=== /admin/uploads POST (busboy) ===")
  console.log("Content-Type:", req.headers["content-type"]) 
  if (!req.headers["content-type"] || !req.headers["content-type"]!.includes("multipart/form-data")) {
    return res.status(400).json({ message: "Invalid content type. Expected multipart/form-data" })
  }

  try {
    const bb = Busboy({ headers: req.headers as any })

    let storedFilePath: string | null = null
    let originalName: string | null = null
    let mimetype: string | null = null
    let size = 0

    bb.on("file", (_field, file, info) => {
      originalName = info.filename
      mimetype = info.mimeType
      // Reject video uploads early
      if (mimetype && mimetype.startsWith && mimetype.startsWith("video/")) {
        console.warn("Video upload attempted - rejecting:", originalName, mimetype)
        // Drain the stream and respond with error
        file.resume()
        try {
          // let the client know
          res.status(400).json({ message: "Video uploads are not allowed" })
        } catch (e) {}
        return
      }
      const safe = (originalName || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")
      const filename = `${Date.now()}-${safe}`
      storedFilePath = path.join(uploadDir, filename)
      const writeStream = fs.createWriteStream(storedFilePath)
      file.on("data", (data) => {
        size += data.length
      })
      file.pipe(writeStream)
      writeStream.on("error", (err) => {
        console.error("Write stream error:", err)
        try { fs.unlinkSync(storedFilePath!) } catch {}
        res.status(500).json({ message: "Failed to write file" })
      })
    })

    bb.on("error", (err) => {
      console.error("Busboy error:", err)
      res.status(500).json({ message: "Upload parsing failed" })
    })

    bb.on("finish", () => {
      if (!storedFilePath) {
        return res.status(400).json({ message: "No file uploaded" })
      }
      const url = `/static/uploads/${path.basename(storedFilePath)}`
      console.log("Upload OK ->", url)
      res.json({ url, filename: originalName, size, mimetype })
    })

    ;(req as any).pipe(bb as any)
  } catch (e: any) {
    console.error("Upload handler failed:", e)
    return res.status(500).json({ message: e?.message || "Upload failed" })
  }
}