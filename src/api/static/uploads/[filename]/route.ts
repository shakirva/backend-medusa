import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".gif":
      return "image/gif"
    case ".webp":
      return "image/webp"
    case ".svg":
      return "image/svg+xml"
    default:
      return "application/octet-stream"
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("=== STATIC FILE REQUEST ===")
  console.log("Requested filename:", (req.params as any)?.filename)
  console.log("Full URL:", req.url)
  
  const filename = (req.params as any)?.filename as string
  if (!filename || /\.\.|\//.test(filename)) {
    console.log("Invalid filename:", filename)
    return res.status(400).json({ message: "Invalid filename" })
  }

  const filePath = path.join(process.cwd(), "static", "uploads", filename)
  console.log("Looking for file at:", filePath)
  console.log("File exists?", fs.existsSync(filePath))
  
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath)
    return res.status(404).json({ message: "Not found" })
  }

  console.log("Serving file:", filename)
  res.setHeader("Content-Type", getContentType(filename))
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
  const stream = fs.createReadStream(filePath)
  stream.on("error", () => {
    res.status(500).end()
  })
  stream.pipe(res as any)
}
