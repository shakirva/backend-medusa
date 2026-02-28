import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogService from "../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)

        // Get all published posts to extract categories
        const posts = await blogService.listBlogPosts(
            { is_published: true },
            { select: ["category"] as any }
        )

        const categories = Array.from(new Set(
            posts
                .map(p => p.category)
                .filter(c => c !== null && c !== undefined && c !== "")
        ))

        res.json({ categories })
    } catch (e: any) {
        console.error('Store blog categories error:', e)
        res.status(500).json({ message: e?.message || 'Failed to fetch categories' })
    }
}
