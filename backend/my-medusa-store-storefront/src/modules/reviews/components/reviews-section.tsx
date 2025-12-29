import { listProductReviews } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import ReviewForm from "@modules/reviews/components/review-form"

interface Props {
  product: HttpTypes.StoreProduct
}

export default async function ReviewsSection({ product }: Props) {
  const productId = product.id!
  let reviews: any[] = []
  try {
    const data = await listProductReviews(productId)
    reviews = data.reviews || []
  } catch (e) {
    // ignore fetch errors; show empty state
  }

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="mt-10 border-t pt-6" id="reviews">
      <h2 className="text-lg font-semibold mb-2">Customer Reviews</h2>
      <div className="text-sm text-neutral-600 mb-4">
        {average ? (
          <>Average rating: <strong>{average}</strong> / 5 ({reviews.length} review{reviews.length===1?'':'s'})</>
        ) : (
          <>No reviews yet.</>
        )}
      </div>
      <ReviewForm productId={productId} />
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="border rounded p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{r.title || 'Untitled'}</span>
              <span className="text-xs text-yellow-600">{"★".repeat(r.rating)}{"☆".repeat(Math.max(0,5-r.rating))}</span>
            </div>
            {r.content && <p className="text-sm text-neutral-700 whitespace-pre-line">{r.content}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
