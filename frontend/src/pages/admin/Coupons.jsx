import { useState, useEffect } from 'react'
import { Plus, Tag, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Modal, InputField, SelectField, EmptyState, Spinner } from '../../components/ui'
import { format } from 'date-fns'

const EMPTY_COUPON = {
  code: '', description: '', discount_type: 'percent', discount_value: '',
  min_order_value: '', max_uses: '', valid_until: '',
}

export default function AdminCoupons() {
  const { toast } = useToast()
  const [coupons, setCoupons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]         = useState(EMPTY_COUPON)
  const [saving, setSaving]     = useState(false)

  const fetch = async () => {
    setLoading(true)
    try { const { data } = await api.get('/coupons'); setCoupons(data) }
    catch { toast('Failed to load coupons', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.code.trim()) { toast('Coupon code is required', 'error'); return }
    if (!form.discount_value) { toast('Discount value is required', 'error'); return }
    setSaving(true)
    try {
      await api.post('/coupons', {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until || null,
      })
      toast('Coupon created!', 'success')
      setCreateOpen(false)
      setForm(EMPTY_COUPON)
      fetch()
    } catch (err) {
      toast(err.response?.data?.message || 'Create failed', 'error')
    } finally { setSaving(false) }
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/coupons/${id}/toggle`)
      fetch()
    } catch { toast('Toggle failed', 'error') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Coupons</h1>
        <button onClick={() => { setForm(EMPTY_COUPON); setCreateOpen(true) }} className="btn-accent gap-2">
          <Plus size={16}/> New Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="input pl-9 text-sm" placeholder="Search coupons…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet"
          description="Create discount codes to attract more customers."
          action={<button onClick={() => setCreateOpen(true)} className="btn-accent text-sm gap-1"><Plus size={14}/>Create Coupon</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const expired = c.valid_until && new Date(c.valid_until) < new Date()
                  const full = c.max_uses && c.used_count >= c.max_uses
                  return (
                    <tr key={c.id}>
                      <td>
                        <div>
                          <p className="font-mono font-bold text-sm">{c.code}</p>
                          {c.description && <p className="text-xs text-[#6b7280] mt-0.5">{c.description}</p>}
                        </div>
                      </td>
                      <td className="capitalize text-sm">{c.discount_type}</td>
                      <td className="text-sm font-semibold">
                        {c.discount_type === 'percent'
                          ? `${parseFloat(c.discount_value)}%`
                          : `₹${parseFloat(c.discount_value).toLocaleString('en-IN')}`}
                      </td>
                      <td className="text-sm">
                        {parseFloat(c.min_order_value) > 0 ? `₹${parseFloat(c.min_order_value).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="text-sm">
                        {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                      </td>
                      <td className="text-sm">
                        {c.valid_until
                          ? <span className={expired ? 'text-red-500' : 'text-green-600'}>
                              {format(new Date(c.valid_until), 'dd MMM yyyy')}
                            </span>
                          : <span className="text-[#6b7280]">No expiry</span>}
                      </td>
                      <td>
                        {expired || full
                          ? <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">
                              {expired ? 'Expired' : 'Exhausted'}
                            </span>
                          : c.is_active
                            ? <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Active</span>
                            : <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">Inactive</span>}
                      </td>
                      <td>
                        <button onClick={() => handleToggle(c.id)}
                          className={`transition-colors ${c.is_active ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500'}`}
                          title={c.is_active ? 'Deactivate' : 'Activate'}>
                          {c.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Coupon" size="md">
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField label="Coupon Code *" placeholder="e.g. SUMMER20" value={form.code}
            onChange={e => f('code', e.target.value.toUpperCase())} />
          <SelectField label="Discount Type" value={form.discount_type} onChange={e => f('discount_type', e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
          </SelectField>
          <InputField label={form.discount_type === 'percent' ? 'Discount (%)' : 'Discount Amount (₹)'}
            type="number" min="0" value={form.discount_value}
            onChange={e => f('discount_value', e.target.value)} />
          <InputField label="Min Order Value (₹)" type="number" min="0" placeholder="0 = no minimum"
            value={form.min_order_value} onChange={e => f('min_order_value', e.target.value)} />
          <InputField label="Max Uses" type="number" min="1" placeholder="Leave blank for unlimited"
            value={form.max_uses} onChange={e => f('max_uses', e.target.value)} />
          <InputField label="Valid Until" type="date" value={form.valid_until}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => f('valid_until', e.target.value)} />
          <InputField label="Description (optional)" placeholder="e.g. 20% off for summer sale"
            value={form.description} onChange={e => f('description', e.target.value)} className="sm:col-span-2" />

          <div className="sm:col-span-2 flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
