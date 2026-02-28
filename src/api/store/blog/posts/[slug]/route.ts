import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../../modules/blog"
import BlogService from "../../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const { slug } = req.params

        const posts = await blogService.listBlogPosts(
            { slug, is_published: true },
            { take: 1 }
        )

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: "Post not found" })
        }

        res.json({ post: posts[0] })
    } catch (e: any) {
        console.error('Store blog post detail error:', e)
        res.status(500).json({ message: e?.message || 'Failed to fetch blog post' })
    }
}
