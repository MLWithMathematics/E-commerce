import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Minus, Plus, Star, Heart } from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { PageLoader, StarRating, Price, StatusBadge, Modal, InputField, TextareaField } from '../components/ui'
import SEO from '../components/SEO'
import RecentlyViewed from '../components/RecentlyViewed'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { upsert } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const { push: pushRecentlyViewed, items: recentlyViewed } = useRecentlyViewed()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedImg, setSelectedImg] = useState(0)
  const [pin, setPin] = useState('')
  const [etd, setEtd] = useState(null)
  const [etdLoading, setEtdLoading] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Review state
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [reviewSaving, setReviewSaving] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const checkDelivery = async () => {
    if (pin.length !== 6) return
    setEtdLoading(true)
    setEtd(null)
    try {
      const res = await api.get(`/shipping/estimate?pincode=${pin}`)
      setEtd(res.data)
    } catch {
      setEtd({ error: 'Could not fetch delivery info' })
    } finally {
      setEtdLoading(false)
    }
  }

  const fetchProduct = () => {
    api.get(`/products/${id}`)
      .then(r => { setProduct(r.data); setSelectedImg(0) })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProduct() }, [id])

  // Track view after product loads
  useEffect(() => {
    if (product) pushRecentlyViewed(product)
  }, [product?.id])

  if (loading) return <PageLoader />
  if (!product) return null

  const images = [product.image_url, ...(product.images || [])].filter(Boolean)
  const disc = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const wishlisted = isWishlisted(parseInt(id))

  const handleAddToCart = async () => {
    if (!user) { toast('Please sign in', 'info'); navigate('/login'); return }
    await upsert(product.id, qty)
    toast(`${product.name} added to cart!`, 'success')
  }

  const handleToggleWishlist = async () => {
    if (!user) { toast('Please sign in to save items', 'info'); navigate('/login'); return }
    setWishlistLoading(true)
    try {
      const nowWishlisted = await toggleWishlist(product.id)
      toast(nowWishlisted ? 'Added to wishlist!' : 'Removed from wishlist', nowWishlisted ? 'success' : 'info')
    } catch { toast('Could not update wishlist', 'error') }
    finally { setWishlistLoading(false) }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.rating) { toast('Please select a rating', 'error'); return }
    setReviewSaving(true)
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm })
      toast('Review submitted!', 'success')
      setReviewOpen(false)
      setReviewForm({ rating: 5, title: '', comment: '' })
      fetchProduct()
    } catch (err) {
      toast(err.response?.data?.message || 'Could not submit review', 'error')
    } finally { setReviewSaving(false) }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at the best price on WipSom.`}
        image={product.image_url}
        type="product"
        canonical={`/products/${product.id}`}
        price={product.price}
        availability={product.stock > 0}
      />
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="card p-0 overflow-hidden rounded-2xl">
            <img src={images[selectedImg] || 'https://placehold.co/600x400?text=Product'}
              alt={product.name} className="w-full h-72 sm:h-96 object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                    ${selectedImg === i ? 'border-[#f59e0b]' : 'border-gray-200 hover:border-gray-400'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.is_new_arrival && (
            <span className="text-[#f59e0b] text-xs font-bold uppercase tracking-widest">✦ New Arrival</span>
          )}
          <h1 className="font-display text-3xl font-bold text-[#1a1f2e]">{product.name}</h1>
          <div className="flex items-center gap-3">
            <StarRating rating={product.rating} size={16} />
            <span className="text-sm text-[#6b7280]">({product.review_count} reviews)</span>
            {user && (
              <button onClick={() => setReviewOpen(true)}
                className="text-xs text-[#f59e0b] font-medium hover:underline ml-1">
                Write a review
              </button>
            )}
          </div>

          <Price price={product.price} original={product.original_price} className="text-xl" />

          {product.description && (
            <p className="text-[#6b7280] leading-relaxed text-sm">{product.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className={product.stock === 0 ? 'text-red-500' : 'text-[#6b7280]'}>
              {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left!` : 'In stock'}
            </span>
          </div>

          {product.category_name && (
            <div className="flex gap-2">
              <span className="text-xs bg-gray-100 text-[#6b7280] px-3 py-1 rounded-full">{product.category_name}</span>
            </div>
          )}

          {/* Delivery estimate */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-2.5">
            <p className="text-sm font-medium text-[#1a1f2e]">Check delivery to your pincode</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 110001"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setEtd(null) }}
                onKeyDown={e => e.key === 'Enter' && checkDelivery()}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
              />
              <button onClick={checkDelivery} disabled={pin.length !== 6 || etdLoading}
                className="btn-accent text-sm px-4 py-2 disabled:opacity-50">
                {etdLoading ? 'Checking…' : 'Check'}
              </button>
            </div>
            {etd && !etd.error && (
              <p className="text-sm text-green-700 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                Delivery by <strong>{etd.etd}</strong> via {etd.courier}
              </p>
            )}
            {etd?.error && <p className="text-sm text-red-500">{etd.error}</p>}
          </div>

          {/* Qty + Add to Cart + Wishlist */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-l-xl text-[#6b7280]">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-r-xl text-[#6b7280]">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-accent flex-1 py-3">
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`p-3 rounded-xl border-2 transition-all ${
                  wishlisted
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-gray-200 hover:border-red-300 hover:text-red-400 text-gray-400'
                }`}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
              </button>
            </div>
          )}

          {/* Out of stock wishlist button */}
          {product.stock === 0 && (
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border-2 transition-all ${
                wishlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-gray-200 hover:border-red-300 text-gray-500'
              }`}
            >
              <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
              {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
          {user && (
            <button onClick={() => setReviewOpen(true)} className="btn-accent text-sm gap-1.5">
              <Star size={14} /> Write a Review
            </button>
          )}
        </div>

        {product.reviews?.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {product.reviews.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#1a1f2e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {r.user_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.user_name}</p>
                      <StarRating rating={r.rating} size={11} showNum={false} />
                    </div>
                  </div>
                  <span className="text-xs text-[#6b7280]">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.title && <p className="font-medium text-sm mt-2">{r.title}</p>}
                {r.comment && <p className="text-sm text-[#6b7280] mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <Star size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-[#6b7280] text-sm">No reviews yet. Be the first to review this product!</p>
            {user && (
              <button onClick={() => setReviewOpen(true)} className="btn-accent text-sm mt-3">
                Write the first review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed items={recentlyViewed} exclude={parseInt(id)} />

      {/* Write Review Modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Write a Review" size="md">
        <div className="space-y-4">
          {/* Star picker */}
          <div>
            <label className="label mb-2">Your Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= (hoverRating || reviewForm.rating)
                        ? 'text-[#f59e0b] fill-[#f59e0b]'
                        : 'text-gray-200 fill-gray-200'
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-[#6b7280] self-center">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || reviewForm.rating]}
              </span>
            </div>
          </div>
          <InputField
            label="Review Title (optional)"
            placeholder="Summarise your experience"
            value={reviewForm.title}
            onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
          />
          <TextareaField
            label="Review (optional)"
            placeholder="Tell others what you think about this product…"
            value={reviewForm.comment}
            onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-1">
            <button className="btn-ghost" onClick={() => setReviewOpen(false)}>Cancel</button>
            <button className="btn-accent" onClick={handleSubmitReview} disabled={reviewSaving}>
              {reviewSaving ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
