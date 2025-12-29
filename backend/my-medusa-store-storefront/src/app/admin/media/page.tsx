"use client"

import { useState, useEffect, useRef } from "react"
import admin from "@lib/admin"

export default function MediaAdmin() {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string>("")
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const json = await admin.listMedia()
      setItems(json.media || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function onCreate(e: any) {
    e.preventDefault()
    setError("")
    setNotice("")

    let uploadedUrl: string | null = null

    if (file) {
      setUploadError("")
      setUploading(true)
      setUploadProgress(0)

      try {
        const uploaded = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr
          xhr.open('POST', `${window.location.origin}/api/admin-upload-proxy`)

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
            }
          }

          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.onabort = () => reject(new Error('Upload cancelled'))

          xhr.onload = () => {
            const text = xhr.responseText || ''
            let data: any = null
            try { data = JSON.parse(text) } catch (e) { data = { url: text } }

            if (xhr.status >= 200 && xhr.status < 300) {
              const u = data?.url || data?.result || text || null
              if (u) return resolve(u)
              return reject(new Error('Upload succeeded but no URL returned'))
            }

            const message = data?.message || data?.error || text || `Upload failed (${xhr.status})`
            return reject(new Error(message))
          }

          const fd = new FormData()
          fd.append('file', file)
          xhr.send(fd)
        })

        uploadedUrl = uploaded
        if (uploadedUrl) setUrl(uploadedUrl)
      } catch (err: any) {
        console.error('Upload error', err)
        const msg = `Failed to upload file: ${err?.message ?? String(err)}`
        setUploadError(msg)
        setError(msg)
        setUploading(false)
        setUploadProgress(0)
        return
      } finally {
        setUploading(false)
      }
    }

    const finalUrl = uploadedUrl || url
    if (!finalUrl || !String(finalUrl).trim()) {
      setError("Image URL is required")
      return
    }

    setLoading(true)
    try {
      await admin.createMedia({ url: finalUrl, title })
      setUrl("")
      setTitle("")
      setFile(null)
      setNotice("Media created successfully")
      await fetchList()
    } catch (err) {
      console.error('Create media error', err)
      setError("Failed to create media")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Media</h2>
      {notice && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">{notice}</div>}
      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
      <form onSubmit={onCreate} className="space-y-3 mb-6">
        <div>
          <label className="block text-sm">Upload File</label>
          <input type="file" accept="image/*" onChange={(e)=>{ setUploadError(''); setFile(e.target.files?.[0] || null) }} disabled={uploading} />
            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <div>{uploadProgress}%</div>
                  <button type="button" className="text-red-600 underline" onClick={() => { xhrRef.current?.abort(); setUploading(false); setUploadProgress(0); setUploadError('Upload cancelled') }}>Cancel</button>
                </div>
              </div>
            )}
            {uploadError && !uploading && (
              <div className="mt-2 text-xs text-red-700">{uploadError}</div>
            )}
        </div>
        <div>
          <label className="block text-sm">Image URL</label>
          <input className="w-full border px-2 py-1" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Title</label>
          <input className="w-full border px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-black text-white" disabled={loading}>{loading ? 'Creating...' : 'Create Media'}</button>
      </form>

      <h3 className="text-lg font-medium mb-2">Existing Media</h3>
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className="border p-2 grid grid-cols-5 gap-2 items-center">
            {/* Render video if URL looks like a video, otherwise image */}
            {typeof m.url === 'string' && m.url.match(/\.(mp4|webm|ogg|mov)(?:\?|$)/i) ? (
              <video src={m.url} className="w-32 h-16 object-cover" controls />
            ) : (
              <img src={m.url} alt={m.title || 'media'} className="w-32 h-16 object-cover" />
            )}
            <div>
              <label className="block text-xs">Title</label>
              <input className="w-full border px-2 py-1" defaultValue={m.title || ''} onBlur={(e)=>admin.updateMedia(m.id, { title: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs">URL</label>
              <input className="w-full border px-2 py-1" defaultValue={m.url} onBlur={(e)=>admin.updateMedia(m.id, { url: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <button className="px-3 py-1 bg-red-600 text-white" onClick={async ()=>{ await admin.deleteMedia(m.id); await fetchList(); }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
