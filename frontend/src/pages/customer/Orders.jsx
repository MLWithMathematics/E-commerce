import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { RefreshCw, XCircle, Calendar, ChevronDown, ChevronUp, Package, RotateCcw, Zap } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { PageLoader, StatusBadge, EmptyState, Modal, ConfirmDialog, TextareaField } from '../../components/ui'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import SEO from '../../components/SEO'

const STATUS_FILTERS = ['all','pending','confirmed','processing','shipped','delivered','cancelled','refunded']

export default function OrdersPage() {
  const { toast } = useToast()
  const { user, token } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId]     = useState(null)
  const [rescheduleOrder, setRescheduleOrder] = useState(null)
  const [cancelTarget, setCancelTarget]       = useState(null)
  const [newDate, setNewDate] = useState('')

  // Return request state
  const [returnTarget, setReturnTarget] = useState(null)   // order id
  const [returnReason, setReturnReason] = useState('')
  const [returnSaving, setReturnSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const { data } = await api.get(`/orders/my${params}`)
      setOrders(data.orders)
    } catch { toast('Failed to load orders', 'error') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Real-time order status updates via Socket.io
  const handleOrderUpdate = useCallback((payload) => {
    setOrders(prev => prev.map(o =>
      o.id === payload.order_id
        ? { ...o, status: payload.status, tracking_number: payload.tracking_number ?? o.tracking_number }
        : o
    ))
    toast(`Order #${payload.order_id} is now ${payload.status} ⚡`, 'info')
  }, [toast])

  useOrderSocket(token, handleOrderUpdate)

  const handleCancel = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`)
      toast('Order cancelled successfully', 'success')
      fetchOrders()
    } catch (err) { toast(err.response?.data?.message || 'Cannot cancel order', 'error') }
  }

  const handleReschedule = async () => {
    if (!newDate) { toast('Please select a date', 'error'); return }
    try {
      await api.patch(`/orders/${rescheduleOrder}/reschedule`, { scheduled_date: newDate })
      toast('Delivery rescheduled!', 'success')
      setRescheduleOrder(null)
      fetchOrders()
    } catch (err) { toast(err.response?.data?.message || 'Cannot reschedule', 'error') }
  }

  const handleReorder = async (orderId) => {
    try {
      const { data } = await api.post(`/orders/${orderId}/reorder`)
      toast(`${data.count} item(s) added to cart!`, 'success')
    } catch { toast('Reorder failed', 'error') }
  }

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) { toast('Please describe your reason for return', 'error'); return }
    setReturnSaving(true)
    try {
      await api.post(`/returns/${returnTarget}`, { reason: returnReason })
      toast('Return request submitted! We will review it shortly.', 'success')
      setReturnTarget(null)
      setReturnReason('')
      fetchOrders()
    } catch (err) {
      toast(err.response?.data?.message || 'Could not submit return request', 'error')
    } finally { setReturnSaving(false) }
  }

  return (
    <div className="space-y-5 anim-fade-up">
      <SEO title="My Orders" description="Track and manage your WipSom orders." noindex />
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all
              ${statusFilter===s ? 'bg-[#1a1f2e] text-white' : 'bg-white border border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>
            {s === 'all' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" description="Start shopping to place your first order"
          action={<a href="/products" className="btn-accent text-sm">Browse Products</a>} />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(p => p === order.id ? null : order.id)}
              onCancel={() => setCancelTarget(order.id)}
              onReorder={() => handleReorder(order.id)}
              onReschedule={() => { setRescheduleOrder(order.id); setNewDate('') }}
              onReturn={() => { setReturnTarget(order.id); setReturnReason('') }}
            />
          ))}
        </div>
      )}

      {/* Reschedule modal */}
      <Modal open={!!rescheduleOrder} onClose={() => setRescheduleOrder(null)} title="Reschedule Delivery" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">New Delivery Date</label>
            <input type="date" className="input" value={newDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setNewDate(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setRescheduleOrder(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleReschedule}>Reschedule</button>
          </div>
        </div>
      </Modal>

      {/* Return Request modal */}
      <Modal open={!!returnTarget} onClose={() => setReturnTarget(null)} title="Request a Return" size="sm">
        <div className="space-y-4">
          <div className="text-sm text-[#6b7280] bg-amber-50 border border-amber-200 rounded-xl p-3">
            Our team will review your request within 24–48 hours and contact you with next steps.
          </div>
          <TextareaField
            label="Reason for Return *"
            placeholder="e.g. Item received was damaged, wrong item shipped, item does not match description…"
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setReturnTarget(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleReturnRequest} disabled={returnSaving}>
              {returnSaving ? 'Submitting…' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm cancel */}
      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}
        onConfirm={() => { handleCancel(cancelTarget); setCancelTarget(null) }}
        title="Cancel Order" message="Are you sure you want to cancel this order? This action cannot be undone for shipped orders."
        danger />
    </div>
  )
}

function OrderCard({ order, expanded, onToggle, onCancel, onReorder, onReschedule, onReturn }) {
  const canCancel     = ['pending','confirmed'].includes(order.status)
  const canReschedule = ['pending','confirmed'].includes(order.status)
  const canReturn     = order.status === 'delivered'
  const items = order.items?.filter(i => i.id) || []

  return (
    <div className="card">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-[#6b7280]">Order #{order.id}</span>
            <StatusBadge status={order.status} />
            {order.return_status && (
              <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full capitalize">
                Return: {order.return_status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#6b7280]">
            <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
            <span>·</span>
            <span className="font-semibold text-[#1a1f2e]">₹{parseFloat(order.total).toLocaleString('en-IN')}</span>
            {order.payment_method && (
              <><span>·</span><span className="capitalize text-xs">{order.payment_method}</span></>
            )}
            {order.tracking_number && (
              <><span>·</span><span className="text-[#f59e0b] font-mono text-xs">Track: {order.tracking_number}</span></>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button onClick={onReorder} className="btn-ghost text-xs gap-1.5">
            <RefreshCw size={13}/> Reorder
          </button>
          {canReschedule && (
            <button onClick={onReschedule} className="btn-ghost text-xs gap-1.5">
              <Calendar size={13}/> Reschedule
            </button>
          )}
          {canReturn && !order.return_status && (
            <button onClick={onReturn}
              className="btn-ghost text-xs gap-1.5 text-orange-600 hover:bg-orange-50 border border-orange-200">
              <RotateCcw size={13}/> Return
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel} className="btn-danger text-xs gap-1.5 py-1.5 px-3">
              <XCircle size={13}/> Cancel
            </button>
          )}
          <button onClick={onToggle} className="btn-ghost p-1.5">
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.image_url || 'https://placehold.co/60x60?text=P'}
                  alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-[#6b7280]">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          {order.shipping_address && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#6b7280]">
              <span className="font-semibold text-[#1a1f2e]">Ship to: </span>{order.shipping_address}
            </div>
          )}
          {order.notes && (
            <div className="mt-1 text-xs text-[#6b7280]">
              <span className="font-semibold text-[#1a1f2e]">Notes: </span>{order.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
