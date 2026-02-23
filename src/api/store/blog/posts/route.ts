import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogService from "../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0

        // For store API, only return published posts
        const [posts, count] = await blogService.listAndCountBlogPosts(
            { is_published: true },
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
