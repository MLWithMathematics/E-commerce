import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { StatusBadge, Spinner, EmptyState } from '../../components/ui'
import { Package } from 'lucide-react'

export default function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const q = statusFilter ? `?status=${statusFilter}` : ''
      const { data } = await api.get(`/orders/admin/all${q}`)
      setOrders(data.orders)
    } catch { toast('Failed to load orders', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [statusFilter])

  const updateStatus = async (id, status) => {
    try { await api.patch(`/orders/admin/${id}/status`, { status }); toast('Updated', 'success'); fetchOrders() }
    catch { toast('Update failed', 'error') }
  }

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Orders Management</h1>
        <select className="input w-auto text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s=>(
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> :
        orders.length === 0 ? <EmptyState icon={Package} title="No orders found" /> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th>Change Status</th><th></th></tr></thead>
              <tbody>
                {orders.flatMap(o => {
                  const rows = [
                    <tr key={o.id}>
                      <td className="font-mono text-xs text-[#6b7280]">#{o.id}</td>
                      <td><p className="text-sm font-medium">{o.customer_name}</p><p className="text-xs text-[#6b7280]">{o.customer_email}</p></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="font-semibold text-sm">₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                      <td className="text-xs text-[#6b7280]">{format(new Date(o.created_at),'MMM d, yyyy')}</td>
                      <td>
                        <select className="input text-xs py-1 w-36" value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>
                          {['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><button onClick={()=>setExpandedId(p=>p===o.id?null:o.id)} className="btn-ghost p-1.5">{expandedId===o.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button></td>
                    </tr>
                  ]
                  if (expandedId===o.id) rows.push(
                    <tr key={`${o.id}-d`}><td colSpan={7} className="bg-gray-50 px-8 py-3 text-xs text-[#6b7280]">Items: {o.item_count} {o.shipping_address&&`· Ship to: ${o.shipping_address}`} {o.tracking_number&&`· Track: ${o.tracking_number}`}</td></tr>
                  )
                  return rows
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
