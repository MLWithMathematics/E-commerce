import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Minus, Plus, Star } from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageLoader, StarRating, Price, StatusBadge } from '../components/ui'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { upsert } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedImg, setSelectedImg] = useState(0)
  const [pin, setPin] = useState('')
  const [etd, setEtd] = useState(null)
  const [etdLoading, setEtdLoading] = useState(false)

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

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => { setProduct(r.data); setSelectedImg(0) })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!product) return null

  const images = [product.image_url, ...(product.images || [])].filter(Boolean)
  const disc = product.original_price > product.price
    ? Math.round((1-product.price/product.original_price)*100) : 0

  const handleAddToCart = async () => {
    if (!user) { toast('Please sign in', 'info'); navigate('/login'); return }
    await upsert(product.id, qty)
    toast(`${product.name} added to cart!`, 'success')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    ${selectedImg===i ? 'border-[#f59e0b]' : 'border-gray-200 hover:border-gray-400'}`}>
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

          {/* Category tag */}
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
                onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setEtd(null) }}
                onKeyDown={e => e.key==='Enter' && checkDelivery()}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
              />
              <button
                onClick={checkDelivery}
                disabled={pin.length!==6 || etdLoading}
                className="btn-accent text-sm px-4 py-2 disabled:opacity-50"
              >
                {etdLoading ? 'Checking…' : 'Check'}
              </button>
            </div>
            {etd && !etd.error && (
              <p className="text-sm text-green-700 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                Delivery by <strong>{etd.etd}</strong> via {etd.courier}
              </p>
            )}
            {etd?.error && (
              <p className="text-sm text-red-500">{etd.error}</p>
            )}
          </div>

          {/* Qty + Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl">
                <button onClick={() => setQty(q => Math.max(1, q-1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-l-xl text-[#6b7280]">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-r-xl text-[#6b7280]">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-accent flex-1 py-3">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-6">Customer Reviews</h2>
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
        </div>
      )}
    </div>
  )
}
