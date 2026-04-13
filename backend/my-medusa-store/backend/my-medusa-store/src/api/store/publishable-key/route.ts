import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Public endpoint to return the publishable key for client-side store fetches.
// This returns the key that is safe to expose to frontend clients (publishable keys are intended for public use).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.MEDUSA_PUBLISHABLE_KEY || null
    if (!key) return res.status(404).json({ message: 'No publishable key configured' })
    res.json({ publishable_key: key })
  } catch (e: any) {
    console.error('Publishable key endpoint error', e)
    res.status(500).json({ message: 'Failed to retrieve publishable key' })
  }
}
