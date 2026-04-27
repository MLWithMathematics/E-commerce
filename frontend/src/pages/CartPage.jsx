import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { EmptyState, Modal, InputField, SelectField, TextareaField } from '../components/ui'


export default function CartPage() {
  const { items, total, upsert, remove, clear, refetch } = useCart()
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    notes: '',
    payment_method: 'card',
    scheduled_date: '',
    upi_ref: '',
  })

  // UPI config — replace with your actual UPI ID and shop name
  const UPI_ID = 'yourshop@upi'
  const SHOP_NAME = 'WipSom'

  const handleQtyChange = async (product_id, newQty) => {
    if (newQty <= 0) {
      await remove(product_id)
    } else {
      await upsert(product_id, newQty)
    }
  }

  const handlePlaceOrder = async () => {
    if (!form.shipping_address.trim()) { toast('Please enter a shipping address', 'error'); return }
    setPlacing(true)
    try {
      const orderItems = items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      await api.post('/orders', {
        items: orderItems,
        shipping_address: form.shipping_address,
        notes: form.notes,
        payment_method: form.payment_method,
        upi_ref: form.payment_method === 'upi' ? form.upi_ref : undefined,
        scheduled_date: form.scheduled_date || undefined,
      })
      await refetch()
      toast('Order placed successfully! 🎉', 'success')
      setCheckoutOpen(false)
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
      <h1 className="page-title mb-6">Shopping Cart <span className="text-[#6b7280] font-body text-base font-normal">({items.length} item{items.length!==1?'s':''})</span></h1>

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
              {/* Qty controls */}
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
              {/* Subtotal */}
              <span className="text-sm font-bold w-16 text-right shrink-0">
                ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
              </span>
              <button onClick={() => remove(item.product_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button onClick={clear} className="text-sm text-[#6b7280] hover:text-red-500 flex items-center gap-1.5 transition-colors mt-2">
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>

        {/* Order summary */}
        <div className="card h-fit sticky top-24">
          <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
          <div className="space-y-2.5 text-sm">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-[#6b7280]">
                <span className="truncate max-w-[160px]">{i.name} × {i.quantity}</span>
                <span>₹{(parseFloat(i.price)*i.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-[#1a1f2e]">
              <span>Total</span>
              <span>₹{parseFloat(total).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={() => setCheckoutOpen(true)} className="btn-accent w-full mt-5 py-3 text-base">
            Checkout <ArrowRight size={18} />
          </button>
          <Link to="/products" className="block text-center text-sm text-[#6b7280] hover:text-[#1a1f2e] mt-3">
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
            onChange={e => setForm(p=>({...p, shipping_address:e.target.value}))} />
          <SelectField label="Payment Method"
            value={form.payment_method}
            onChange={e => setForm(p=>({...p, payment_method:e.target.value, upi_ref:''}))}
          >
            <option value="card">Credit / Debit Card</option>
            <option value="upi">UPI (0% fee)</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
            <option value="cod">Cash on Delivery</option>
          </SelectField>

          {/* Fix 3: UPI deep-link panel — works on mobile; shows QR for desktop */}
          {form.payment_method === 'upi' && (() => {
            const upiAmount = parseFloat(total).toFixed(2)
            const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${upiAmount}&cu=INR`
            // QR code via free public API (no key needed)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUri)}&size=180x180&margin=10`
            return (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-green-800">Pay ₹{upiAmount} via UPI (0% fee)</p>

                {/* Mobile: tap to open app directly */}
                <a
                  href={upiUri}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-green-700 transition-colors md:hidden"
                >
                  <svg viewBox="0 0 48 48" fill="none" width="20" height="20">
                    <rect width="48" height="48" rx="8" fill="white"/>
                    <text x="24" y="32" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#5f259f">U</text>
                  </svg>
                  Open PhonePe / GPay / Paytm
                </a>

                {/* Desktop: scan QR with phone */}
                <div className="hidden md:flex flex-col items-center gap-2">
                  <p className="text-xs text-green-700 font-medium">Scan with any UPI app on your phone</p>
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    className="rounded-xl border-2 border-green-200 bg-white p-1"
                    width={180} height={180}
                  />
                  <p className="text-[11px] text-green-600">Works with PhonePe, GPay, Paytm, BHIM & all UPI apps</p>
                </div>

                <p className="text-xs text-green-700">After paying, paste your UPI transaction ID below to confirm:</p>
                <InputField
                  placeholder="e.g. 316987654321"
                  value={form.upi_ref}
                  onChange={e => setForm(p => ({...p, upi_ref: e.target.value}))}
                />
              </div>
            )
          })()}
          <InputField label="Schedule Delivery (optional)" type="date"
            value={form.scheduled_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setForm(p=>({...p, scheduled_date:e.target.value}))} />
          <InputField label="Order Notes (optional)" placeholder="Leave a note..."
            value={form.notes}
            onChange={e => setForm(p=>({...p, notes:e.target.value}))} />

          {/* Summary in modal */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>{items.length} item(s)</span>
              <span className="text-[#f59e0b]">₹{parseFloat(total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setCheckoutOpen(false)}>Back to Cart</button>
            <button className="btn-accent flex-1 py-3" onClick={handlePlaceOrder} disabled={placing}>
              {placing ? 'Placing…' : `Pay ₹${parseFloat(total).toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
