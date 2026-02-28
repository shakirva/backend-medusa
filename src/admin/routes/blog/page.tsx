import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentTextSolid, PhotoSolid } from "@medusajs/icons"
import { Container, Heading, Button, Input, Text, clx, Badge, Switch } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useEffect } from "react"
import { sdk } from "../../lib/sdk"

type BlogPost = {
    id: string
    title: string
    slug: string
    content?: string
    excerpt?: string
    author?: string
    image_url?: string
    category?: string
    reading_time?: string
    likes_count?: number
    is_featured: boolean
    is_published: boolean
    published_at?: string
    created_at: string
}

type BlogResponse = {
    posts: BlogPost[]
    count: number
}

const BlogPostCard = ({
    post,
    onEdit,
    onDelete
}: {
    post: BlogPost
    onEdit: (post: BlogPost) => void
    onDelete: (id: string) => void
}) => {
    const [showActions, setShowActions] = useState(false)

    return (
        <div
            className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-200 group flex flex-col"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Image Container */}
            <div className="h-40 w-full bg-gray-100 overflow-hidden relative">
                {post.image_url ? (
                    <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <PhotoSolid className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <Badge color={post.is_published ? "green" : "grey"} size="small">
                        {post.is_published ? "Published" : "Draft"}
                    </Badge>
                    {post.is_featured && (
                        <Badge color="blue" size="small">Featured</Badge>
                    )}
                </div>
                {post.category && (
                    <div className="absolute bottom-3 left-3">
                        <Badge color="purple" size="small">{post.category}</Badge>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-2 h-14">{post.title}</h3>
                {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex flex-col">
                        <span>{post.author || "Admin"}</span>
                        {post.reading_time && <span>{post.reading_time}</span>}
                    </div>
                    <div className="text-right">
                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        {post.likes_count !== undefined && <div className="mt-1">❤️ {post.likes_count}</div>}
                    </div>
                </div>
            </div>

            {/* Hover Actions */}
            <div
                className={clx(
                    "absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-200",
                    showActions ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onEdit(post)}
                    className="bg-white hover:bg-gray-50"
                >
                    Edit
                </Button>
                <Button
                    variant="danger"
                    size="small"
                    onClick={() => onDelete(post.id)}
                >
                    Delete
                </Button>
            </div>
        </div>
    )
}

const BlogPostFormDrawer = ({
    isOpen,
    onClose,
    post,
    onSave
}: {
    isOpen: boolean
    onClose: () => void
    post: BlogPost | null
    onSave: (data: any) => void
}) => {
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [excerpt, setExcerpt] = useState("")
    const [content, setContent] = useState("")
    const [author, setAuthor] = useState("")
    const [category, setCategory] = useState("")
    const [readingTime, setReadingTime] = useState("")
    const [isFeatured, setIsFeatured] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState("")
    const [isPublished, setIsPublished] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync state when 'post' changes (crucial for edit mode)
    useEffect(() => {
        if (post) {
            setTitle(post.title || "")
            setSlug(post.slug || "")
            setExcerpt(post.excerpt || "")
            setContent(post.content || "")
            setAuthor(post.author || "")
            setCategory(post.category || "")
            setReadingTime(post.reading_time || "")
            setIsFeatured(post.is_featured || false)
            setImagePreview(post.image_url || "")
            setIsPublished(post.is_published ?? false)
        } else {
            setTitle("")
            setSlug("")
            setExcerpt("")
            setContent("")
            setAuthor("")
            setCategory("")
            setReadingTime("")
            setIsFeatured(false)
            setImagePreview("")
            setIsPublished(false)
        }
        setImageFile(null)
    }, [post, isOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            let imageUrl = post?.image_url || ""

            if (imageFile) {
                const formData = new FormData()
                formData.append("files", imageFile)
                const uploadRes = await fetch("/admin/uploads", {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                })
                const uploadData = await uploadRes.json()
                if (uploadData.uploads?.[0]?.url) {
                    imageUrl = uploadData.uploads[0].url
                }
            }

            onSave({
                id: post?.id,
                title,
                slug: slug || undefined,
                excerpt,
                content,
                author,
                category,
                reading_time: readingTime,
                is_featured: isFeatured,
                image_url: imageUrl,
                is_published: isPublished
            })
        } catch (error) {
            console.error("Error saving blog post:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={onClose} />

            <div className="flex min-h-full items-center justify-center p-4 text-left">
                <div className="relative bg-[#111318] rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all border border-gray-800">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-800 bg-[#1a1d23] rounded-t-2xl flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                            {post ? "Edit Blog Post" : "Create Blog Post"}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                        {/* Image Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Cover Image</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 rounded-xl bg-[#0d0f12] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-700 cursor-pointer group hover:border-[#E63946] transition-colors"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <PhotoSolid className="w-10 h-10 text-gray-500 mx-auto" />
                                        <span className="text-sm text-gray-400">Click to upload image</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Title*</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" className="bg-[#1a1d23] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Author</label>
                                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" className="bg-[#1a1d23] border-gray-700 text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Category</label>
                                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Buying Guide, Technology" className="bg-[#1a1d23] border-gray-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Reading Time</label>
                                <Input value={readingTime} onChange={(e) => setReadingTime(e.target.value)} placeholder="e.g. 5 min to read" className="bg-[#1a1d23] border-gray-700 text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Slug (URL friendly)</label>
                            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="leave-blank-to-auto-generate" className="bg-[#1a1d23] border-gray-700 text-white" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Excerpt</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] outline-none"
                                placeholder="A short summary of the post..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Content (Markdown supported)</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg text-sm font-mono text-white focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] outline-none"
                                placeholder="Write your article here..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between bg-[#1a1d23] p-4 rounded-xl border border-gray-800">
                                <div>
                                    <span className="text-sm font-medium text-white block">Published</span>
                                    <span className="text-xs text-gray-500">Visible on store</span>
                                </div>
                                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                            </div>
                            <div className="flex items-center justify-between bg-[#1a1d23] p-4 rounded-xl border border-gray-800">
                                <div>
                                    <span className="text-sm font-medium text-white block">Featured</span>
                                    <span className="text-xs text-gray-500">Show in hero section</span>
                                </div>
                                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-800 bg-[#1a1d23] rounded-b-2xl flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose} className="bg-transparent border-gray-700 text-white hover:bg-gray-800">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={!title || isLoading} className="bg-[#E63946] hover:bg-[#C62828] text-white border-none shadow-lg shadow-red-900/20">
                            {isLoading ? "Saving..." : (post ? "Update Post" : "Create Post")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const BlogPage = () => {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

    const { data, isLoading } = useQuery<BlogResponse>({
        queryKey: ["blog_posts"],
        queryFn: async () => {
            const response = await sdk.client.fetch("/admin/blog/posts", {
                method: "GET"
            })
            return response as BlogResponse
        }
    })

    const mutation = useMutation({
        mutationFn: async (postData: any) => {
            const url = postData.id ? `/admin/blog/posts/${postData.id}` : "/admin/blog/posts"
            return sdk.client.fetch(url, {
                method: "POST",
                body: postData
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog_posts"] })
            setIsDrawerOpen(false)
            setEditingPost(null)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return sdk.client.fetch(`/admin/blog/posts/${id}`, {
                method: "DELETE"
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog_posts"] })
        }
    })

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post)
        setIsDrawerOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this post?")) {
            deleteMutation.mutate(id)
        }
    }

    const handleSave = (data: any) => {
        mutation.mutate(data)
    }

    const filteredPosts = data?.posts?.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Container className="py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <Heading level="h1" className="text-2xl font-bold text-gray-900">
                            Blog Posts
                        </Heading>
                        <Text className="text-gray-500 mt-1">
                            Create and manage articles for your store
                        </Text>
                    </div>
                    <Button onClick={() => { setEditingPost(null); setIsDrawerOpen(true); }} className="sm:w-auto w-full">
                        + New Post
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-6 max-w-md">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                    />
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <DocumentTextSolid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <Text className="text-gray-500">No blog posts found</Text>
                        <Button variant="secondary" className="mt-4" onClick={() => { setEditingPost(null); setIsDrawerOpen(true); }}>
                            Create your first post
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPosts.map(post => (
                            <BlogPostCard
                                key={post.id}
                                post={post}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                <BlogPostFormDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => { setIsDrawerOpen(false); setEditingPost(null); }}
                    post={editingPost}
                    onSave={handleSave}
                />
            </Container>
        </div>
    )
}

export const config = defineRouteConfig({
    label: "Blog",
    icon: DocumentTextSolid,
})

export default BlogPage
