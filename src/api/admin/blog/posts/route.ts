import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogService from "../../../../modules/blog/service"

export const AUTHENTICATE = true

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0

        const [posts, count] = await blogService.listAndCountBlogPosts(
            {},
            {
                skip: offset,
                take: limit,
                order: { published_at: "DESC", created_at: "DESC" },
            }
        )

        res.json({ posts, count, limit, offset })
    } catch (e: any) {
        console.error('Admin blog post list error:', e)
        res.status(500).json({ message: e?.message || 'Failed to list blog posts' })
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    try {
        const blogService = req.scope.resolve<BlogService>(BLOG_MODULE)
        const body = (req.body || {}) as any

        if (!body?.title) return res.status(400).json({ message: 'title is required' })

        const makeSlug = (v: string) =>
            v
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")

        const slug = body.slug && body.slug !== '' ? body.slug : makeSlug(body.title)

        const [created] = await blogService.createBlogPosts([{
            title: body.title,
            slug,
            content: body.content ?? null,
            excerpt: body.excerpt ?? null,
            author: body.author ?? null,
            image_url: body.image_url ?? null,
            is_published: body.is_published ?? false,
            published_at: body.is_published ? (body.published_at || new Date()) : null,
            category: body.category ?? null,
            reading_time: body.reading_time ?? null,
            likes_count: body.likes_count ?? 0,
            is_featured: body.is_featured ?? false,
            meta_title: body.meta_title ?? null,
            meta_description: body.meta_description ?? null,
            keywords: body.keywords ?? null,
        }])

        res.json({ post: created })
    } catch (e: any) {
        console.error('Admin blog post create error:', e)
        res.status(500).json({ message: e?.message || 'Failed to create blog post' })
    }
}
