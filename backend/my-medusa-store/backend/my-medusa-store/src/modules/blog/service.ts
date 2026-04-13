import { MedusaService } from "@medusajs/framework/utils"
import BlogPost from "./models/post"

/**
 * Blog Module Service
 * Handles CRUD operations for blog posts
 */
class BlogService extends MedusaService({
    BlogPost,
}) {
    // Add any custom logic here
}

export default BlogService
