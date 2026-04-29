import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, CheckCircle2, CreditCard } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { EmptyState, Modal, InputField, SelectField, TextareaField } from '../components/ui'
import { useRazorpay } from '../hooks/useRazorpay'
import SEO from '../components/SEO'

export default function CartPage() {
  const { items, total, upsert, remove, clear, refetch } = useCart()
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pay } = useRazorpay()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [placing, setPlacing] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode]   = useState('')
  const [couponData, setCouponData]   = useState(null)   // applied coupon
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    notes: '',
    payment_method: 'card',
    scheduled_date: '',
    upi_ref: '',
  })

  const UPI_ID    = 'yourshop@upi'
  const SHOP_NAME = 'WipSom'

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
    if (couponData) { setCouponData(null); setCouponCode('') }   // recalculate
    if (newQty <= 0) await remove(product_id)
    else await upsert(product_id, newQty)
  }

  const handlePlaceOrder = async () => {
    if (!form.shipping_address.trim()) { toast('Please enter a shipping address', 'error'); return }
    setPlacing(true)

    const orderItems = items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    const finalAmount = discountedTotal

    // Use Razorpay for card/netbanking/wallet/upi (non-COD)
    if (form.payment_method !== 'cod' && form.payment_method !== 'upi_manual') {
      pay({
        amount:           finalAmount,
        items:            orderItems,
        shipping_address: form.shipping_address,
        notes:            form.notes,
        scheduled_date:   form.scheduled_date || undefined,
        coupon_id:        couponData?.coupon_id,
        userName:         user?.name,
        userEmail:        user?.email,
        userPhone:        user?.phone,
        onSuccess: async (verified) => {
          await refetch()
          toast('Payment successful! Order placed 🎉', 'success')
          setCheckoutOpen(false)
          setCouponData(null)
          setCouponCode('')
          setPlacing(false)
          navigate('/orders')
        },
        onFailure: (msg) => {
          toast(msg || 'Payment failed', 'error')
          setPlacing(false)
        },
      })
      return
    }

    // COD or manual UPI
    try {
      await api.post('/orders', {
        items:            orderItems,
        shipping_address: form.shipping_address,
        notes:            form.notes,
        payment_method:   form.payment_method,
        upi_ref:          form.payment_method === 'upi_manual' ? form.upi_ref : undefined,
        scheduled_date:   form.scheduled_date || undefined,
        coupon_id:        couponData?.coupon_id,
      })
      await refetch()
      toast('Order placed successfully! 🎉', 'success')
      setCheckoutOpen(false)
      setCouponData(null)
      setCouponCode('')
      navigate('/orders')
    } catch (err) {
      toast(err.response?.data?.message || 'Order failed', 'error')
    } finally { setPlacing(false) }
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

            {couponData && (
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-[#1a1f2e]">
                <span>Total</span>
                <span className="text-[#f59e0b]">₹{discountedTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {!couponData && (
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-[#1a1f2e]">
                <span>Total</span>
                <span>₹{parseFloat(total).toLocaleString('en-IN')}</span>
              </div>
            )}
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
                  className="btn-ghost text-sm px-3 border border-gray-200 disabled:opacity-50"
                >
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

          <button onClick={() => setCheckoutOpen(true)} className="btn-accent w-full py-3 text-base">
            Checkout <ArrowRight size={18} />
          </button>
          <Link to="/products" className="block text-center text-sm text-[#6b7280] hover:text-[#1a1f2e]">
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Complete Your Order" size="md">
        <div className="space-y-4">
          <TextareaField label="Shipping Address *"
            placeholder="Street, City, State, ZIP, Country"
            value={form.shipping_address}
            onChange={e => setForm(p => ({ ...p, shipping_address: e.target.value }))} />
          <SelectField label="Payment Method"
            value={form.payment_method}
            onChange={e => setForm(p => ({ ...p, payment_method: e.target.value, upi_ref: '' }))}>
            <option value="card">Credit / Debit Card (Razorpay)</option>
            <option value="upi">UPI via Razorpay</option>
            <option value="netbanking">Net Banking (Razorpay)</option>
            <option value="wallet">Wallet (Razorpay)</option>
            <option value="upi_manual">UPI — Manual / QR</option>
            <option value="cod">Cash on Delivery</option>
          </SelectField>

          {form.payment_method === 'upi_manual' && (() => {
            const upiAmount = discountedTotal.toFixed(2)
            const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${upiAmount}&cu=INR`
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUri)}&size=180x180&margin=10`
            return (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-green-800">Pay ₹{upiAmount} via UPI (0% fee)</p>
                <a href={upiUri}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-green-700 transition-colors md:hidden">
                  Open PhonePe / GPay / Paytm
                </a>
                <div className="hidden md:flex flex-col items-center gap-2">
                  <p className="text-xs text-green-700 font-medium">Scan with any UPI app on your phone</p>
                  <img src={qrUrl} alt="UPI QR Code" className="rounded-xl border-2 border-green-200 bg-white p-1" width={180} height={180} />
                </div>
                <p className="text-xs text-green-700">After paying, paste your UPI transaction ID below:</p>
                <InputField placeholder="e.g. 316987654321" value={form.upi_ref}
                  onChange={e => setForm(p => ({ ...p, upi_ref: e.target.value }))} />
              </div>
            )
          })()}

          <InputField label="Schedule Delivery (optional)" type="date"
            value={form.scheduled_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
          <InputField label="Order Notes (optional)" placeholder="Leave a note..."
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between text-[#6b7280]">
              <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
              <span>₹{parseFloat(total).toLocaleString('en-IN')}</span>
            </div>
            {couponData && (
              <div className="flex justify-between text-green-700 font-medium">
                <span>Coupon ({couponData.code})</span>
                <span>−₹{couponData.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#1a1f2e] border-t border-gray-200 pt-1.5">
              <span>You pay</span>
              <span className="text-[#f59e0b]">₹{discountedTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setCheckoutOpen(false)}>Back to Cart</button>
            <button className="btn-accent flex-1 py-3 flex items-center justify-center gap-2" onClick={handlePlaceOrder} disabled={placing}>
              {placing ? 'Processing…' : (<><CreditCard size={16}/> Pay ₹{discountedTotal.toLocaleString('en-IN')}</>)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
