import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../../modules/blog"
import BlogService from "../../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const { id } = req.params

        const post = await blogService.retrieveBlogPost(id)
        res.json({ post })
    } catch (e: any) {
        res.status(404).json({ message: "Post not found" })
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const { id } = req.params
        const body = req.body as any

        // Basic sanitize/mapping of fields
        const updateData: any = { id }

        const allowedFields = [
            "title", "slug", "content", "excerpt", "author",
            "image_url", "is_published", "category",
            "reading_time", "likes_count", "is_featured",
            "meta_title", "meta_description", "keywords"
        ]

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        })

        // Handle published_at logic
        if (body.is_published === true) {
            updateData.published_at = body.published_at || new Date()
        } else if (body.is_published === false) {
            updateData.published_at = null
        }

        const updated = await blogService.updateBlogPosts([updateData])

        res.json({ post: updated[0] })
    } catch (e: any) {
        console.error('Admin blog post update error:', e)
        res.status(500).json({ message: e?.message || 'Failed to update blog post' })
    }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const { id } = req.params

        await blogService.deleteBlogPosts([id])
        res.json({ id, object: "blog_post", deleted: true })
    } catch (e: any) {
        console.error('Admin blog post delete error:', e)
        res.status(500).json({ message: e?.message || 'Failed to delete blog post' })
    }
}
