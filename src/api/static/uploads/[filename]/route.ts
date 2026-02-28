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
    case ".avif":
      return "image/avif"
    case ".mp4":
      return "video/mp4"
    case ".webm":
      return "video/webm"
    case ".mov":
      return "video/quicktime"
    case ".avi":
      return "video/x-msvideo"
    case ".mkv":
      return "video/x-matroska"
    case ".m4v":
      return "video/mp4"
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

  const contentType = getContentType(filename)
  console.log("Serving file:", filename, "Content-Type:", contentType)
  
  // Add CORS headers for cross-origin video playback
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range")
  res.setHeader("Content-Type", contentType)
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
  
  // Handle range requests for video streaming
  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const range = req.headers.range

  if (range && contentType.startsWith("video/")) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1
    
    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`)
    res.setHeader("Accept-Ranges", "bytes")
    res.setHeader("Content-Length", chunkSize)
    res.status(206)
    
    const stream = fs.createReadStream(filePath, { start, end })
    stream.on("error", () => {
      res.status(500).end()
    })
    stream.pipe(res as any)
  } else {
    res.setHeader("Content-Length", fileSize)
    const stream = fs.createReadStream(filePath)
    stream.on("error", () => {
      res.status(500).end()
    })
    stream.pipe(res as any)
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range")
  res.status(204).end()
}
