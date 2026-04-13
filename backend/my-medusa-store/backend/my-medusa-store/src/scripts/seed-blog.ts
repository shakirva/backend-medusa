import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "../modules/blog"
import BlogService from "../modules/blog/service"

export default async function seedBlogData({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const blogService = container.resolve<BlogService>(BLOG_MODULE)

    logger.info("Seeding blog posts...")

    const samplePosts = [
        {
            title: "iPhone 17 Series: 7 Major Changes From Previous Generations",
            slug: "iphone-17-series-changes",
            excerpt: "Get a sneak peek at the most anticipated features of the upcoming iPhone 17 series.",
            content: "The iPhone 17 series is expected to bring significant changes to the lineup...",
            author: "Marqa Souq Tech",
            image_url: "https://admin.markasouqs.com/uploads/blog/iphone-17.jpg",
            category: "Top Stories",
            reading_time: "5 min to read",
            likes_count: 1,
            is_featured: true,
            is_published: true,
            published_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
        },
        {
            title: "The Ultimate Guide to Portable Coffee Makers: How to Choose, Use, and...",
            slug: "portable-coffee-makers-guide",
            excerpt: "Learn everything you need to know about choosing the perfect portable coffee maker for your travels.",
            content: "Coffee is more than just a drink; it's a ritual. When you're on the go...",
            author: "Lifestyle Editor",
            image_url: "https://admin.markasouqs.com/uploads/blog/coffee-maker.jpg",
            category: "Buying Guide",
            reading_time: "5 min to read",
            likes_count: 1,
            is_featured: false,
            is_published: true,
            published_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
        },
        {
            title: "Top 5 Wireless Speakers for Your Home Office in 2026",
            slug: "top-5-wireless-speakers",
            excerpt: "Upgrade your workspace with these high-quality wireless speakers.",
            content: "A good speaker can transform your productivity and mood at work...",
            author: "Audio Expert",
            image_url: "https://admin.markasouqs.com/uploads/blog/speakers.jpg",
            category: "Speaker",
            reading_time: "7 min to read",
            likes_count: 5,
            is_featured: false,
            is_published: true,
            published_at: new Date(),
        },
        {
            title: "How to Maximize Your Phone's Battery Life",
            slug: "maximize-phone-battery-life",
            excerpt: "Simple tips and tricks to keep your phone running longer during the day.",
            content: "Battery life is one of the most common complaints among smartphone users...",
            author: "Tech Guru",
            category: "How to",
            reading_time: "4 min to read",
            likes_count: 12,
            is_featured: false,
            is_published: true,
            published_at: new Date(),
        }
    ]

    for (const post of samplePosts) {
        const existing = await blogService.listBlogPosts({ slug: post.slug })
        if (existing.length === 0) {
            await blogService.createBlogPosts([post])
            logger.info(`Created blog post: ${post.title}`)
        } else {
            logger.info(`Blog post already exists: ${post.title}`)
        }
    }

    logger.info("Blog seeding complete.")
}
