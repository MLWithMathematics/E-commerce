import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import { EmptyState } from '../components/ui'
import SEO from '../components/SEO'

export default function CartPage() {
  const { items, total, upsert, remove, clear } = useCart()
  const { toast }   = useToast()
  const navigate    = useNavigate()

  const [couponCode, setCouponCode]     = useState('')
  const [couponData, setCouponData]     = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]   = useState('')

  const discountedTotal = couponData
    ? Math.max(0, parseFloat(total) - couponData.discount_amount)
    : parseFloat(total)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponCode.trim(),
        order_total: total,
      })
      setCouponData(data)
      toast(`Coupon applied! You save ₹${data.discount_amount.toLocaleString('en-IN')}`, 'success')
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon')
      setCouponData(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponData(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleQtyChange = async (product_id, newQty) => {
    if (couponData) { setCouponData(null); setCouponCode('') }
    if (newQty <= 0) await remove(product_id)
    else await upsert(product_id, newQty)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState icon={ShoppingBag} title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={<Link to="/products" className="btn-accent text-sm">Browse Products</Link>} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 anim-fade-up">
      <SEO title="My Cart" description="Review your cart and place your order on WipSom." noindex />
      <h1 className="page-title mb-6">
        Shopping Cart{' '}
        <span className="text-[#6b7280] font-body text-base font-normal">
          ({items.length} item{items.length !== 1 ? 's' : ''})
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card flex items-center gap-4">
              <img src={item.image_url || 'https://placehold.co/80x80?text=P'}
                alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                <p className="text-sm font-bold text-[#f59e0b] mt-0.5">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                {item.stock < 5 && item.stock > 0 && (
                  <p className="text-xs text-orange-500 mt-0.5">Only {item.stock} left</p>
                )}
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl shrink-0">
                <button onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-l-xl text-[#6b7280]">
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-r-xl text-[#6b7280] disabled:opacity-40">
                  <Plus size={13} />
                </button>
              </div>
              <span className="text-sm font-bold w-16 text-right shrink-0">
                ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
              </span>
              <button onClick={() => handleQtyChange(item.product_id, 0)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-[#6b7280] hover:text-red-500 flex items-center gap-1.5 transition-colors mt-2">
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>

        {/* Order summary */}
        <div className="card h-fit sticky top-24 space-y-4">
          <h3 className="font-display font-semibold text-lg">Order Summary</h3>

          <div className="space-y-2.5 text-sm">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-[#6b7280]">
                <span className="truncate max-w-[160px]">{i.name} × {i.quantity}</span>
                <span>₹{(parseFloat(i.price) * i.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-2.5 flex justify-between text-[#1a1f2e]">
              <span>Subtotal</span>
              <span className="font-semibold">₹{parseFloat(total).toLocaleString('en-IN')}</span>
            </div>

            {couponData && (
              <div className="flex justify-between text-green-700 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Coupon ({couponData.code})
                </span>
                <span>−₹{couponData.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-[#1a1f2e]">
              <span>Total</span>
              <span className={couponData ? 'text-[#f59e0b]' : ''}>
                ₹{discountedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Coupon input */}
          {!couponData ? (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#1a1f2e]">
                <Tag size={13} /> Apply Coupon
              </label>
              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponLoading}
                  className="btn-ghost text-sm px-3 border border-gray-200 disabled:opacity-50">
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle2 size={15} />
                <span className="font-semibold">{couponData.code}</span>
                <span className="text-green-600 text-xs">−₹{couponData.discount_amount.toLocaleString('en-IN')}</span>
              </div>
              <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-900">
                <X size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/checkout', { state: { couponData } })}
            className="btn-accent w-full py-3 text-base">
            Checkout <ArrowRight size={18} />
          </button>
          <Link to="/products" className="block text-center text-sm text-[#6b7280] hover:text-[#1a1f2e]">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
