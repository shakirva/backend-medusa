import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogService from "../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0

        // Build filters
        const filters: any = { is_published: true }
        if (req.query.category) {
            filters.category = req.query.category
        }
        if (req.query.is_featured !== undefined) {
            filters.is_featured = req.query.is_featured === 'true'
        }

        const [posts, count] = await blogService.listAndCountBlogPosts(
            filters,
            {
                skip: offset,
                take: limit,
                order: { published_at: "DESC" },
            }
        )

        res.json({ posts, count, limit, offset })
    } catch (e: any) {
        console.error('Store blog post list error:', e)
        res.status(500).json({ message: e?.message || 'Failed to list blog posts' })
    }
}
