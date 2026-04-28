import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { PageLoader, EmptyState, Price, StarRating } from '../components/ui'

export default function WishlistPage() {
  const { items, loading, toggle } = useWishlist()
  const { upsert } = useCart()
  const { toast } = useToast()

  const handleAddToCart = async (item) => {
    if (item.stock === 0) { toast('This item is out of stock', 'error'); return }
    await upsert(item.product_id, 1)
    toast(`${item.name} added to cart!`, 'success')
  }

  const handleRemove = async (product_id, name) => {
    await toggle(product_id)
    toast(`${name} removed from wishlist`, 'info')
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 anim-fade-up">
      <h1 className="page-title mb-6">
        My Wishlist
        {items.length > 0 && (
          <span className="text-[#6b7280] font-body text-base font-normal ml-2">
            ({items.length} item{items.length !== 1 ? 's' : ''})
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love and come back to them later."
          action={<Link to="/products" className="btn-accent text-sm">Explore Products</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card hover:shadow-md transition-shadow group">
              {/* Image */}
              <Link to={`/products/${item.product_id}`} className="block mb-3">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={item.image_url || 'https://placehold.co/300x200?text=P'}
                    alt={item.name}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="space-y-1.5">
                {item.category_name && (
                  <span className="text-xs text-[#6b7280] bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.category_name}
                  </span>
                )}
                <Link to={`/products/${item.product_id}`}>
                  <h3 className="font-medium text-sm hover:text-[#f59e0b] transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </Link>
                <StarRating rating={item.rating} size={12} />
                <Price price={item.price} original={item.original_price} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stock === 0}
                  className="btn-accent flex-1 text-sm py-2 gap-1.5 disabled:opacity-50"
                >
                  <ShoppingCart size={14} /> Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item.product_id, item.name)}
                  className="btn-ghost p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                  title="Remove from wishlist"
                >
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
