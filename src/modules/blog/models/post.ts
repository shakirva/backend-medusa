import { model } from "@medusajs/framework/utils"

/**
 * Blog entity representing articles/blog posts
 */
const BlogPost = model.define("blog_post", {
    id: model.id().primaryKey(),
    title: model.text(),
    slug: model.text().unique(),
    content: model.text().nullable(),
    excerpt: model.text().nullable(),
    author: model.text().nullable(),
    image_url: model.text().nullable(),
    is_published: model.boolean().default(false),
    published_at: model.dateTime().nullable(),
    meta_title: model.text().nullable(),
    meta_description: model.text().nullable(),
    keywords: model.text().nullable(),
})

export default BlogPost
