import { useState, useEffect } from 'react'
import { RotateCcw, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Modal, TextareaField, StatusBadge, EmptyState, Spinner } from '../../components/ui'
import { format } from 'date-fns'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  refunded: 'bg-green-100 text-green-700',
}

const STATUS_ICONS = {
  pending:  <Clock size={13}/>,
  approved: <CheckCircle2 size={13}/>,
  rejected: <XCircle size={13}/>,
  refunded: <RefreshCw size={13}/>,
}

export default function AdminReturns() {
  const { toast } = useToast()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionModal, setActionModal] = useState(null)   // { id, currentStatus }
  const [actionForm, setActionForm]   = useState({ status: '', admin_note: '' })
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try { const { data } = await api.get('/returns/admin/all'); setReturns(data) }
    catch { toast('Failed to load return requests', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = statusFilter === 'all'
    ? returns
    : returns.filter(r => r.status === statusFilter)

  const openAction = (r) => {
    setActionForm({ status: r.status, admin_note: r.admin_note || '' })
    setActionModal(r)
  }

  const handleUpdate = async () => {
    if (!actionForm.status) { toast('Please select a status', 'error'); return }
    setSaving(true)
    try {
      await api.patch(`/returns/admin/${actionModal.id}`, actionForm)
      toast('Return request updated!', 'success')
      setActionModal(null)
      fetch()
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Return Requests</h1>
        <div className="text-sm text-[#6b7280]">{returns.filter(r => r.status==='pending').length} pending</div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['all', 'pending', 'approved', 'rejected', 'refunded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all
              ${statusFilter===s ? 'bg-[#1a1f2e] text-white' : 'bg-white border border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No return requests"
          description={statusFilter === 'all' ? 'No return requests have been submitted yet.' : `No ${statusFilter} requests.`} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Order Total</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-sm text-[#6b7280]">#{r.id}</td>
                    <td className="font-mono text-sm">#{r.order_id}</td>
                    <td>
                      <p className="text-sm font-medium">{r.customer_name}</p>
                      <p className="text-xs text-[#6b7280]">{r.customer_email}</p>
                    </td>
                    <td>
                      <p className="text-sm max-w-xs truncate" title={r.reason}>{r.reason}</p>
                    </td>
                    <td className="text-sm font-semibold">
                      ₹{parseFloat(r.order_total).toLocaleString('en-IN')}
                    </td>
                    <td className="text-sm text-[#6b7280]">
                      {format(new Date(r.created_at), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex items-center gap-1 w-fit ${STATUS_COLORS[r.status]}`}>
                        {STATUS_ICONS[r.status]} {r.status}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => openAction(r)}
                        className="btn-ghost text-xs px-3 py-1.5 border border-gray-200">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={`Return Request #${actionModal?.id}`} size="sm">
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Order</span>
                <span className="font-mono font-medium">#{actionModal.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer</span>
                <span className="font-medium">{actionModal.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Order Total</span>
                <span className="font-semibold">₹{parseFloat(actionModal.order_total).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="label mb-1">Customer's Reason</label>
              <p className="text-sm text-[#6b7280] bg-gray-50 rounded-xl p-3">{actionModal.reason}</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">Update Status</label>
              <div className="grid grid-cols-2 gap-2">
                {['pending','approved','rejected','refunded'].map(s => (
                  <button key={s} type="button" onClick={() => setActionForm(p => ({...p, status: s}))}
                    className={`py-2 rounded-xl text-xs font-medium capitalize border-2 transition-all
                      ${actionForm.status === s ? 'border-[#1a1f2e] bg-[#1a1f2e] text-white' : 'border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <TextareaField label="Admin Note (optional)" placeholder="Internal note or message to customer…"
              value={actionForm.admin_note}
              onChange={e => setActionForm(p => ({...p, admin_note: e.target.value}))} />

            {actionForm.status === 'refunded' && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ Setting status to <strong>Refunded</strong> will also update the order status to "refunded" and mark the payment as refunded.
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button className="btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
              <button className="btn-accent" onClick={handleUpdate} disabled={saving}>
                {saving ? 'Updating…' : 'Update Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
