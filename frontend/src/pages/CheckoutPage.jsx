import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useRazorpay } from '../hooks/useRazorpay'
import api from '../api/client'
import { InputField, SelectField, TextareaField } from '../components/ui'
import SEO from '../components/SEO'

const UPI_ID    = 'yourshop@upi'
const SHOP_NAME = 'WipSom'

export default function CheckoutPage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { items, total, refetch } = useCart()
  const { user }   = useAuth()
  const { toast }  = useToast()
  const { pay }    = useRazorpay()

  // Coupon data is passed in from CartPage via navigate state
  const couponData = location.state?.couponData ?? null

  const discountedTotal = couponData
    ? Math.max(0, parseFloat(total) - couponData.discount_amount)
    : parseFloat(total)

  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    notes: '',
    payment_method: 'card',
    scheduled_date: '',
    upi_ref: '',
  })
  const [placing, setPlacing] = useState(false)

  // Guard: if cart is somehow empty on this page, send back
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-[#6b7280] mb-4">Your cart is empty.</p>
        <Link to="/products" className="btn-accent text-sm">Browse Products</Link>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    if (!form.shipping_address.trim()) { toast('Please enter a shipping address', 'error'); return }
    setPlacing(true)

    const orderItems  = items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    const finalAmount = discountedTotal

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
        onSuccess: async () => {
          await refetch()
          toast('Payment successful! Order placed 🎉', 'success')
          setPlacing(false)
          navigate('/orders', { replace: true })
        },
        onFailure: (msg) => {
          toast(msg || 'Payment failed', 'error')
          setPlacing(false)
        },
      })
      return
    }

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
      navigate('/orders', { replace: true })
    } catch (err) {
      toast(err.response?.data?.message || 'Order failed', 'error')
    } finally { setPlacing(false) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 anim-fade-up">
      <SEO title="Checkout" description="Complete your WipSom order." noindex />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cart')} className="btn-ghost p-1.5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="page-title">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: form ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-base">Shipping &amp; Payment</h2>

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
              const upiUri    = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${upiAmount}&cu=INR`
              const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUri)}&size=180x180&margin=10`
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
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div className="card h-fit sticky top-24 space-y-4">
          <h3 className="font-display font-semibold text-lg">Order Summary</h3>

          <div className="space-y-2 text-sm">
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
              <span>You pay</span>
              <span className="text-[#f59e0b]">₹{discountedTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="btn-accent w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            {placing ? 'Processing…' : (<><CreditCard size={16}/> Pay ₹{discountedTotal.toLocaleString('en-IN')}</>)}
          </button>

          <Link to="/cart" className="block text-center text-sm text-[#6b7280] hover:text-[#1a1f2e]">
            ← Back to Cart
          </Link>
        </div>
      </div>
    </div>
  )
}
