import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { StatusBadge, Spinner, EmptyState, InputField, Modal } from '../../components/ui'
import { Package } from 'lucide-react'

export function AdminOrders() {
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

export function AdminInventory() {
  const { toast } = useToast()
  const [data, setData] = useState({ products:[], low_stock:[], out_of_stock:[] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/products/admin/inventory').then(r=>setData(r.data)).catch(()=>toast('Failed','error')).finally(()=>setLoading(false))
  }, [])

  const displayed = filter==='low' ? data.low_stock : filter==='out' ? data.out_of_stock : data.products

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <div className="flex gap-2">
          {[['all','All'],['low',`Low Stock (${data.low_stock.length})`],['out',`Out of Stock (${data.out_of_stock.length})`]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter===v?'bg-[#1a1f2e] text-white':'bg-white border border-gray-200 text-[#6b7280] hover:border-gray-400'}`}>{l}</button>
          ))}
        </div>
      </div>
      {loading?<div className="flex justify-center py-10"><Spinner/></div>:(
        <div className="card p-0 overflow-hidden">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Updated</th></tr></thead>
            <tbody>
              {displayed.map(p=>(
                <tr key={p.id}>
                  <td className="font-medium text-sm">{p.name}</td>
                  <td className="text-sm text-[#6b7280]">{p.category||'—'}</td>
                  <td><span className={`font-bold text-sm ${p.stock===0?'text-red-500':p.stock<=5?'text-orange-500':'text-green-600'}`}>{p.stock===0?'OUT':p.stock}</span></td>
                  <td className="text-sm">₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                  <td className="text-xs text-[#6b7280]">{format(new Date(p.updated_at),'MMM d, yyyy')}</td>
                </tr>
              ))}
              {displayed.length===0&&<tr><td colSpan={5} className="text-center py-8 text-sm text-[#6b7280]">No items in this view</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AdminPayments() {
  const { toast } = useToast()
  const [data, setData] = useState({ payments:[], stats:{} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/all').then(r=>setData(r.data)).catch(()=>toast('Failed','error')).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="space-y-5 anim-fade-up">
      <h1 className="page-title">Payments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['Total Received',`₹${parseFloat(data.stats.total_received||0).toLocaleString('en-IN')}`,'text-green-600'],['Pending',`₹${parseFloat(data.stats.total_pending||0).toLocaleString('en-IN')}`,'text-[#f59e0b]'],['Transactions',data.stats.total_transactions||0,'text-[#1a1f2e]']].map(([l,v,c])=>(
          <div key={l} className="stat-card"><p className={`text-2xl font-bold font-display ${c}`}>{v}</p><p className="text-xs text-[#6b7280]">{l}</p></div>
        ))}
      </div>
      {loading?<div className="flex justify-center py-10"><Spinner/></div>:(
        <div className="card p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Customer</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.payments.map(p=>(
                <tr key={p.id}>
                  <td className="font-mono text-xs text-[#6b7280]">#{p.id}</td>
                  <td><p className="text-sm font-medium">{p.customer_name}</p><p className="text-xs text-[#6b7280]">{p.customer_email}</p></td>
                  <td className="font-mono text-xs">#{p.order_id}</td>
                  <td className="font-semibold text-sm">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                  <td className="text-xs capitalize">{p.method}</td>
                  <td><StatusBadge status={p.status}/></td>
                  <td className="text-xs text-[#6b7280]">{format(new Date(p.created_at),'MMM d, yyyy')}</td>
                </tr>
              ))}
              {data.payments.length===0&&<tr><td colSpan={7} className="text-center py-8 text-sm text-[#6b7280]">No payment records yet</td></tr>}
            </tbody>
          </table>
        </div></div>
      )}
    </div>
  )
}

export function AdminCategories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchCats = () => { setLoading(true); api.get('/categories').then(r=>setCategories(r.data)).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(()=>{fetchCats()},[])

  const save = async () => {
    if (!editCat.name) return toast('Name required','error')
    setSaving(true)
    try {
      if (editCat.id) await api.put(`/categories/${editCat.id}`,editCat)
      else await api.post('/categories',editCat)
      toast('Saved!','success'); setEditCat(null); fetchCats()
    } catch { toast('Save failed','error') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/categories/${id}`); fetchCats(); toast('Deleted','success') }
    catch { toast('Delete failed','error') }
  }

  return (
    <div className="space-y-5 anim-fade-up">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button onClick={()=>setEditCat({name:'',description:'',image_url:''})} className="btn-accent text-sm gap-1.5"><Plus size={15}/>Add Category</button>
      </div>
      {loading?<div className="flex justify-center py-10"><Spinner/></div>:(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
          {categories.map(c=>(
            <div key={c.id} className="card-hover p-0 overflow-hidden anim-fade-up">
              <img src={c.image_url||'https://placehold.co/400x200?text=Category'} alt={c.name} className="w-full h-28 object-cover"/>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">{c.product_count} products</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>setEditCat({...c})} className="btn-ghost text-xs py-1 px-3 gap-1"><Edit2 size={11}/>Edit</button>
                  <button onClick={()=>del(c.id)} className="btn-ghost text-xs py-1 px-3 text-red-400 hover:text-red-600 gap-1"><Trash2 size={11}/>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editCat} onClose={()=>setEditCat(null)} title={editCat?.id?'Edit Category':'New Category'} size="sm">
        {editCat&&(
          <div className="space-y-3">
            <InputField label="Name *" value={editCat.name} onChange={e=>setEditCat(p=>({...p,name:e.target.value}))}/>
            <InputField label="Description" value={editCat.description||''} onChange={e=>setEditCat(p=>({...p,description:e.target.value}))}/>
            <InputField label="Image URL" placeholder="https://..." value={editCat.image_url||''} onChange={e=>setEditCat(p=>({...p,image_url:e.target.value}))}/>
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-ghost" onClick={()=>setEditCat(null)}>Cancel</button>
              <button className="btn-accent" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function AdminAbout() {
  const { toast } = useToast()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})

  useEffect(()=>{ api.get('/about').then(r=>setSections(r.data)).catch(()=>{}).finally(()=>setLoading(false)) },[])

  const updateSection = (idx,key,val) => setSections(p=>p.map((s,i)=>i===idx?{...s,[key]:val}:s))

  const saveSection = async (section) => {
    setSaving(p=>({...p,[section.section]:true}))
    try {
      let meta = section.meta
      if (typeof meta==='string') { try{meta=JSON.parse(meta)}catch{meta={}} }
      await api.put('/about',{section:section.section,title:section.title,body:section.body,meta})
      toast(`"${section.section}" saved!`,'success')
    } catch { toast('Save failed','error') }
    finally { setSaving(p=>({...p,[section.section]:false})) }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner/></div>

  return (
    <div className="space-y-5 anim-fade-up max-w-3xl">
      <h1 className="page-title">About Page Editor</h1>
      <p className="text-sm text-[#6b7280]">Changes reflect immediately on the public About page.</p>
      {sections.map((s,idx)=>(
        <div key={s.section} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold capitalize">{s.section} Section</h3>
            <button onClick={()=>saveSection(s)} disabled={saving[s.section]} className="btn-primary text-xs py-1.5 px-4 disabled:opacity-60">{saving[s.section]?'Saving…':'Save Section'}</button>
          </div>
          <InputField label="Title" value={s.title||''} onChange={e=>updateSection(idx,'title',e.target.value)}/>
          <div>
            <label className="label">Body</label>
            <textarea className="input min-h-[80px] resize-y text-sm" value={s.body||''} onChange={e=>updateSection(idx,'body',e.target.value)}/>
          </div>
          <div>
            <label className="label">Meta (JSON)</label>
            <textarea className="input min-h-[70px] font-mono text-xs resize-y"
              value={typeof s.meta==='string'?s.meta:JSON.stringify(s.meta||{},null,2)}
              onChange={e=>updateSection(idx,'meta',e.target.value)}/>
            <p className="text-[11px] text-[#6b7280] mt-1">Edit raw JSON for dynamic fields like stats, CTA, contact details.</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminOrders
