import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { Spinner } from '../../components/ui'

export default function AdminInventory() {
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
