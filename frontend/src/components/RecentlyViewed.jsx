import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { StarRating, Price } from './ui'

/**
 * RecentlyViewed
 * Renders a horizontal scroll row of recently viewed products.
 * Pass `exclude` to hide the current product.
 */
export default function RecentlyViewed({ items = [], exclude = null }) {
  const visible = exclude ? items.filter(p => p.id !== exclude) : items
  if (!visible.length) return null

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-[#6b7280]" />
        <h3 className="font-display font-semibold text-lg text-[#1a1f2e]">Recently Viewed</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
        {visible.map(product => {
          const disc = product.original_price > product.price
            ? Math.round((1 - product.price / product.original_price) * 100)
            : 0
          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="shrink-0 w-44 card p-0 overflow-hidden group hover:shadow-lg transition-all duration-200 no-underline"
            >
              <div className="relative">
                <img
                  src={product.image_url || 'https://placehold.co/176x120?text=P'}
                  alt={product.name}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {disc > 0 && (
                  <span className="absolute top-2 left-2 bg-[#f59e0b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {disc}% OFF
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-[#1a1f2e] leading-snug line-clamp-2">{product.name}</p>
                {product.rating > 0 && (
                  <StarRating rating={product.rating} size={10} showNum={false} />
                )}
                <Price
                  price={product.price}
                  original={product.original_price}
                  className="text-xs"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
